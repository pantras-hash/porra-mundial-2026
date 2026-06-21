#!/usr/bin/env python3
"""Fast vectorized Monte Carlo odds generator for the World Cup porra.

Inputs:
  - monte_carlo_data.json: static predictions extracted from the original workbook
  - resultats.js: current official/final results
Outputs:
  - odds_latest.js
  - timestamped CSV/JSON/JS files for odds_history/
"""
import argparse, csv, json, math, re, zipfile, unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import numpy as np

FINAL_STATUSES = {"FINISHED", "AWARDED", "FINISHED_PEN", "AFTER_PENALTIES"}

def norm_team(t):
    if t is None: return None
    s=str(t).strip()
    if not s or s in ('#N/A','TBD','None'): return None
    repl={
        'South Korea':'Korea Republic','United States':'USA','Turkey':'Türkiye','Turkiye':'Türkiye',
        'Ivory Coast':"Côte d'Ivoire",'Côte d’Ivoire':"Côte d'Ivoire",'Cote d\'Ivoire':"Côte d'Ivoire",
        'Iran':'IR Iran','Cape Verde':'Cabo Verde','Bosnia and Herzegovina':'Bosnia-Herzegovina',
        'Panam':'Panama','Curaçao':'Curaçao','Curacao':'Curaçao',
    }
    return repl.get(s,s)


def norm_person(x):
    if x is None:
        return ''
    s=str(x).strip().casefold()
    s=s.replace('ø','o').replace('đ','d').replace('ı','i').replace('ł','l')
    s=unicodedata.normalize('NFKD',s)
    s=''.join(ch for ch in s if not unicodedata.combining(ch))
    return re.sub(r'[^a-z0-9]+','',s)

def load_pichichi_config(path):
    if not path:
        return {}
    pp=Path(path)
    if not pp.exists():
        return {}
    return json.loads(pp.read_text(encoding='utf-8'))

RATING={
'Argentina':2120,'France':2100,'Spain':2055,'England':2045,'Portugal':2015,'Brazil':2010,'Netherlands':1990,'Germany':1985,
'Belgium':1940,'Uruguay':1930,'Colombia':1915,'Croatia':1895,'Morocco':1885,'USA':1855,'Switzerland':1845,'Mexico':1840,
'Japan':1830,'Senegal':1825,'Ecuador':1815,'Austria':1810,'IR Iran':1785,'Korea Republic':1780,'Australia':1770,
'Türkiye':1765,'Egypt':1760,"Côte d'Ivoire":1755,'Norway':1750,'Scotland':1745,'Paraguay':1735,'Canada':1725,'Czechia':1720,
'Ghana':1710,'Algeria':1705,'Qatar':1685,'Saudi Arabia':1680,'Tunisia':1675,'Panama':1655,'South Africa':1645,
'Uzbekistan':1640,'DR Congo':1635,'Iraq':1625,'Bosnia-Herzegovina':1620,'Cabo Verde':1605,'Haiti':1565,'Jordan':1555,'New Zealand':1545,'Curaçao':1525,
}

def parse_resultats_js(path):
    text=Path(path).read_text(encoding='utf-8')
    out={}
    entry_re=re.compile(r'"(?P<id>[^"]+)"\s*:\s*\{(?P<body>.*?)\}', re.S)
    def field(body,name):
        m=re.search(rf'{name}\s*:\s*("[^"]*"|null|-?\d+(?:\.\d+)?)', body)
        if not m: return None
        raw=m.group(1)
        if raw=='null': return None
        if raw.startswith('"'): return raw.strip('"')
        try: return int(float(raw))
        except Exception: return None
    for m in entry_re.finditer(text):
        mid=m.group('id'); body=m.group('body')
        hs=field(body,'homeScore'); aw=field(body,'awayScore'); status=field(body,'status') or 'FINISHED'
        if isinstance(hs,int) and isinstance(aw,int) and status in FINAL_STATUSES:
            out[mid]=(hs,aw)
    return out


def _score_to_pair(score):
    a,b=str(score).split('-')
    return int(a), int(b)

def _prepare_score_bucket(rows):
    scores=np.array([_score_to_pair(r['score']) for r in rows],dtype=np.int16)
    probs=np.array([float(r['probability']) for r in rows],dtype=np.float64)
    probs=probs/probs.sum()
    return scores, probs

def load_empirical_score_model(path):
    if not path:
        return None
    pp=Path(path)
    if not pp.exists():
        raise FileNotFoundError(f'Empirical score model not found: {path}')
    return json.loads(pp.read_text(encoding='utf-8'))

def short_names(names):
    def base(n):
        parts=str(n).split(); return n if len(parts)<2 else f'{parts[0]} {parts[1][0].upper()}.'
    bases={n:base(n) for n in names}; counts=Counter(bases.values()); out={}
    for n in names:
        if counts[bases[n]]==1: out[n]=bases[n]
        else:
            parts=n.split(); out[n]=f'{parts[0]} {parts[1][:2].title()}.' if len(parts)>=2 else bases[n]
    return out

class FastMonteCarlo:
    def __init__(self,data,results,seed=20260618,pichichi_config=None,score_model='poisson',empirical_score_model=None):
        self.data=data; self.results=results; self.rng=np.random.default_rng(seed)
        self.score_model=score_model
        self.empirical_score_model=self.prepare_empirical_score_model(empirical_score_model) if score_model=='empirical' else None
        teams=[]
        for gteams in data['groups'].values(): teams.extend(gteams)
        for p in data['players']:
            for m in p['groupMatches']+p['knockoutMatches']:
                for side in ('home','away','winner'):
                    t=norm_team(m.get(side))
                    if t and t!='Empat': teams.append(t)
            for v in p['summary'].values():
                t=norm_team(v)
                if t and t!='Empat': teams.append(t)
        self.teams=sorted(set(teams)); self.tid={t:i for i,t in enumerate(self.teams)}; self.nteams=len(self.teams)
        self.rating=np.array([RATING.get(t,1700) for t in self.teams],dtype=np.float64)
        self.players=data['players']; self.player_names=[p['name'] for p in self.players]; self.P=len(self.players)
        self.group_letters=list('ABCDEFGHIJKL')
        self.gmatches=[m for m in data['matches'] if m['type']=='group']
        self.kmatches=[m for m in data['matches'] if m['type']=='knockout']
        self.gmid=[m['id'] for m in self.gmatches]; self.kmid=[m['id'] for m in self.kmatches]
        self.g_home_ids=np.array([self.team_id(m['home']) for m in self.gmatches],dtype=np.int16)
        self.g_away_ids=np.array([self.team_id(m['away']) for m in self.gmatches],dtype=np.int16)
        self.unfinished_g_idx=[i for i,m in enumerate(self.gmatches) if m['id'] not in self.results]
        self.kindex={mid:i for i,mid in enumerate(self.kmid)}
        self.group_match_indices={g:[i for i,m in enumerate(self.gmatches) if m['group']==g] for g in self.group_letters}
        self.group_team_ids={g:np.array([self.tid[t] for t in data['groups'][g]],dtype=np.int16) for g in self.group_letters}
        self.team_name_order=np.arange(self.nteams,dtype=np.int16)
        self.ko_slots={m['id']:(m['homeSlot'],m['awaySlot']) for m in self.kmatches}
        self.setup_pichichi(pichichi_config or {})
        self.prep_predictions()
        self.stage_cfg=[
            ([self.kindex[f'M{i}'] for i in range(73,89)],4,4,4),
            ([self.kindex[f'M{i}'] for i in range(89,97)],6,6,None),
            ([self.kindex[f'M{i}'] for i in range(97,101)],8,6,None),
            ([self.kindex[f'M{i}'] for i in range(101,103)],10,8,None),
        ]
    def team_id(self,t):
        t=norm_team(t)
        return self.tid.get(t,-1) if t else -1
    def setup_pichichi(self,pichichi_config):
        """Prepare the simple Pichichi proxy model.

        Each tracked scorer's final proxy total in a simulation is:
            current_goals + future matches played by his team in that simulation.
        The winner(s) are the tracked player(s) with the largest proxy total.
        """
        self.pichichi_config=pichichi_config or {}
        self.pichichi_enabled=bool(self.pichichi_config.get('players'))
        rows=[]
        alias_to_idx={}
        def add_row(name,team,goals=0,aliases=None,source='current'):
            team=norm_team(team)
            tid=self.team_id(team)
            if not name or tid<0:
                return None
            keys=[norm_person(name)] + [norm_person(a) for a in (aliases or [])]
            keys=[k for k in keys if k]
            for k in keys:
                if k in alias_to_idx:
                    idx=alias_to_idx[k]
                    rows[idx]['goals']=max(int(rows[idx]['goals']),int(goals or 0))
                    rows[idx]['aliases']=sorted(set(rows[idx].get('aliases',[])+list(aliases or [])+[name]))
                    return idx
            idx=len(rows)
            row={'name':name,'team':team,'teamId':tid,'goals':int(goals or 0),'aliases':sorted(set(list(aliases or [])+[name])),'source':source}
            rows.append(row)
            for k in keys:
                alias_to_idx[k]=idx
            return idx
        for row in self.pichichi_config.get('players',[]):
            add_row(row.get('name'), row.get('team'), row.get('goals',0), row.get('aliases',[]), row.get('source','current'))
        hints={norm_person(k):v for k,v in self.pichichi_config.get('predictionTeamHints',{}).items()}
        missing=[]
        for p in self.players:
            pick=p.get('summary',{}).get('topScorer')
            if not pick:
                continue
            key=norm_person(pick)
            if key in alias_to_idx:
                continue
            team=hints.get(key)
            if team:
                add_row(pick,team,0,[pick],'participant-pick')
            else:
                missing.append(pick)
        self.pichichi_missing_picks=sorted(set(missing))
        self.pichichi_rows=rows
        self.pichichi_alias_to_idx=alias_to_idx
        self.pichichi_names=[r['name'] for r in rows]
        self.pichichi_team_ids=np.array([r['teamId'] for r in rows],dtype=np.int16) if rows else np.array([],dtype=np.int16)
        self.pichichi_current_goals=np.array([r['goals'] for r in rows],dtype=np.int16) if rows else np.array([],dtype=np.int16)
        self.pichichi_goal_counts=Counter()

    def prep_predictions(self):
        G=len(self.gmatches); K=len(self.kmatches); P=self.P
        self.p_g_hs=np.full((P,G),-99,dtype=np.int16); self.p_g_as=np.full((P,G),-99,dtype=np.int16); self.p_g_w=np.full((P,G),-99,dtype=np.int16)
        gindex={m['id']:i for i,m in enumerate(self.gmatches)}
        self.p_st_team=np.full((P,12,4),-99,dtype=np.int16); self.p_st_gf=np.full((P,12,4),-99,dtype=np.int16); self.p_st_pts=np.full((P,12,4),-99,dtype=np.int16)
        self.p_k_home=np.full((P,K),-99,dtype=np.int16); self.p_k_away=np.full((P,K),-99,dtype=np.int16)
        self.p_k_hs=np.full((P,K),-99,dtype=np.int16); self.p_k_as=np.full((P,K),-99,dtype=np.int16)
        self.p_champ=np.full(P,-99,dtype=np.int16); self.p_runner=np.full(P,-99,dtype=np.int16); self.p_third=np.full(P,-99,dtype=np.int16); self.p_fourth=np.full(P,-99,dtype=np.int16)
        self.p_top_scorer=np.full(P,-1,dtype=np.int16); self.p_top_goals=np.full(P,-99,dtype=np.int16)
        for pi,p in enumerate(self.players):
            for m in p['groupMatches']:
                i=gindex[m['id']]
                self.p_g_hs[pi,i]=int(m['homeScore'] if m['homeScore'] is not None else -99)
                self.p_g_as[pi,i]=int(m['awayScore'] if m['awayScore'] is not None else -99)
                self.p_g_w[pi,i]=-1 if m.get('winner')=='Empat' else self.team_id(m.get('winner'))
            for gi,g in enumerate(self.group_letters):
                for pos,row in enumerate(p['groupStandings'][g]):
                    self.p_st_team[pi,gi,pos]=self.team_id(row.get('team'))
                    self.p_st_gf[pi,gi,pos]=int(row['gf'] if row.get('gf') is not None else -99)
                    self.p_st_pts[pi,gi,pos]=int(row['pts'] if row.get('pts') is not None else -99)
            for m in p['knockoutMatches']:
                if m['id'] in self.kindex:
                    i=self.kindex[m['id']]
                    self.p_k_home[pi,i]=self.team_id(m.get('home')); self.p_k_away[pi,i]=self.team_id(m.get('away'))
                    self.p_k_hs[pi,i]=int(m['homeScore'] if m.get('homeScore') is not None else -99)
                    self.p_k_as[pi,i]=int(m['awayScore'] if m.get('awayScore') is not None else -99)
            self.p_champ[pi]=self.team_id(p['summary'].get('champion'))
            self.p_runner[pi]=self.team_id(p['summary'].get('runnerUp'))
            self.p_third[pi]=self.team_id(p['summary'].get('third'))
            self.p_fourth[pi]=self.team_id(p['summary'].get('fourth'))
            ts=p['summary'].get('topScorer')
            self.p_top_scorer[pi]=self.pichichi_alias_to_idx.get(norm_person(ts),-1)
            try:
                self.p_top_goals[pi]=int(p['summary'].get('topScorerGoals') if p['summary'].get('topScorerGoals') is not None else -99)
            except Exception:
                self.p_top_goals[pi]=-99
    def prepare_empirical_score_model(self,model):
        if not model:
            raise ValueError('score_model=empirical requires --empirical-score-model')
        out={'meta':{k:model.get(k) for k in ('source','base_year','recency_weight_half_life_years','smoothing_alpha_per_scoreline')}}
        for stage in ('group','knockout'):
            out[stage]={
                'draw_rate':float(model['empirical_outcome_rates'][stage]['weighted_draw_rate']),
                'win_scores':_prepare_score_bucket(model['buckets'][f'{stage}_win']),
                'draw_scores':_prepare_score_bucket(model['buckets'][f'{stage}_draw']),
            }
        return out

    def draw_scores_empirical(self,home_ids,away_ids,ko=False):
        """Draw scores from a recent-weighted empirical World Cup scoreline model.

        Stage-specific empirical rates decide whether the canonical scoreline is
        a draw or non-draw. For non-draws, a rating-based logistic probability
        decides which team receives the higher goal total.
        """
        home_ids=np.asarray(home_ids,dtype=np.int16)
        away_ids=np.asarray(away_ids,dtype=np.int16)
        B=len(home_ids)
        cfg=self.empirical_score_model['knockout' if ko else 'group']
        is_draw=self.rng.random(B) < cfg['draw_rate']
        h=np.zeros(B,dtype=np.int16); a=np.zeros(B,dtype=np.int16)
        nd=int((~is_draw).sum())
        if nd:
            scores,probs=cfg['win_scores']
            idx=self.rng.choice(len(scores),size=nd,p=probs)
            hi=scores[idx,0]; lo=scores[idx,1]
            diff=self.rating[home_ids[~is_draw]]-self.rating[away_ids[~is_draw]]
            p_home=1/(1+np.exp(-diff/350.0))
            p_home=np.clip(p_home,0.28,0.72)
            home_gets_high=self.rng.random(nd) < p_home
            h[~is_draw]=np.where(home_gets_high,hi,lo).astype(np.int16)
            a[~is_draw]=np.where(home_gets_high,lo,hi).astype(np.int16)
        dd=int(is_draw.sum())
        if dd:
            scores,probs=cfg['draw_scores']
            idx=self.rng.choice(len(scores),size=dd,p=probs)
            g=scores[idx,0]
            h[is_draw]=g.astype(np.int16)
            a[is_draw]=g.astype(np.int16)
        return h,a

    def draw_scores(self,home_ids,away_ids,ko=False):
        if self.score_model=='empirical':
            return self.draw_scores_empirical(home_ids,away_ids,ko)
        diff=(self.rating[home_ids]-self.rating[away_ids])/400.0
        mu_h=np.clip(1.28*np.exp(0.30*diff),0.35,3.2)
        mu_a=np.clip(1.18*np.exp(-0.30*diff),0.30,3.1)
        if ko:
            mu_h*=0.93; mu_a*=0.93
        h=np.minimum(7,self.rng.poisson(mu_h)).astype(np.int16)
        a=np.minimum(7,self.rng.poisson(mu_a)).astype(np.int16)
        return h,a
    def simulate_batch(self,B):
        G=len(self.gmatches); K=len(self.kmatches)
        gh=np.zeros((B,G),dtype=np.int16); ga=np.zeros((B,G),dtype=np.int16)
        home_ids=self.g_home_ids
        away_ids=self.g_away_ids
        for i,m in enumerate(self.gmatches):
            if m['id'] in self.results:
                gh[:,i]=self.results[m['id']][0]; ga[:,i]=self.results[m['id']][1]
            else:
                hids=np.full(B,home_ids[i],dtype=np.int16); aids=np.full(B,away_ids[i],dtype=np.int16)
                gh[:,i],ga[:,i]=self.draw_scores(hids,aids,False)
        gw=np.where(gh>ga,home_ids[None,:],np.where(ga>gh,away_ids[None,:],-1)).astype(np.int16)
        # group tables
        group_team_order={}; group_gf_order={}; group_pts_order={}; group_gd_order={}
        third_team=np.zeros((B,12),dtype=np.int16); third_pts=np.zeros((B,12),dtype=np.int16); third_gd=np.zeros((B,12),dtype=np.int16); third_gf=np.zeros((B,12),dtype=np.int16)
        for gi,g in enumerate(self.group_letters):
            tids=self.group_team_ids[g]
            pts=np.zeros((B,4),dtype=np.int16); gf=np.zeros((B,4),dtype=np.int16); ga2=np.zeros((B,4),dtype=np.int16)
            tpos={tid:i for i,tid in enumerate(tids)}
            for mi in self.group_match_indices[g]:
                hi=tpos[home_ids[mi]]; ai=tpos[away_ids[mi]]
                hg=gh[:,mi]; ag=ga[:,mi]
                gf[:,hi]+=hg; ga2[:,hi]+=ag; gf[:,ai]+=ag; ga2[:,ai]+=hg
                pts[:,hi]+=np.where(hg>ag,3,np.where(hg==ag,1,0)).astype(np.int16)
                pts[:,ai]+=np.where(ag>hg,3,np.where(hg==ag,1,0)).astype(np.int16)
            gd=gf-ga2
            name_key=np.tile(tids,(B,1))
            order=np.lexsort((name_key,-gf,-gd,-pts),axis=1)
            group_team_order[g]=tids[order]
            group_gf_order[g]=np.take_along_axis(gf,order,axis=1)
            group_pts_order[g]=np.take_along_axis(pts,order,axis=1)
            group_gd_order[g]=np.take_along_axis(gd,order,axis=1)
            third_team[:,gi]=group_team_order[g][:,2]
            third_pts[:,gi]=group_pts_order[g][:,2]
            third_gd[:,gi]=group_gd_order[g][:,2]
            third_gf[:,gi]=group_gf_order[g][:,2]
        gname_key=np.tile(np.arange(12),(B,1))
        third_order=np.lexsort((gname_key,-third_gf,-third_gd,-third_pts),axis=1)
        # third slot arrays
        third_slots={slot:np.full(B,-1,dtype=np.int16) for slot in ['1A','1B','1D','1E','1G','1I','1K','1L']}
        group_letters_arr=np.array(self.group_letters)
        matrix=self.data['thirdPlaceMatrix']
        for b in range(B):
            qidx=third_order[b,:8]
            key=''.join(sorted(group_letters_arr[qidx]))
            qseed_to_team={'3'+group_letters_arr[i]:third_team[b,i] for i in qidx}
            row=matrix.get(key,{})
            for slot,seed in row.items():
                if slot in third_slots and seed in qseed_to_team:
                    third_slots[slot][b]=qseed_to_team[seed]
            # fallback for unexpected missing matrix row
            if any(third_slots[slot][b]<0 for slot in third_slots):
                remaining=[third_team[b,i] for i in qidx]
                for slot in third_slots:
                    if third_slots[slot][b]<0:
                        third_slots[slot][b]=remaining.pop(0)
        kh=np.zeros((B,K),dtype=np.int16); ka=np.zeros((B,K),dtype=np.int16); khs=np.zeros((B,K),dtype=np.int16); kas=np.zeros((B,K),dtype=np.int16); kw=np.zeros((B,K),dtype=np.int16); kl=np.zeros((B,K),dtype=np.int16)
        def resolve(slot):
            if slot.startswith('third:'):
                return third_slots[slot.split(':')[1]]
            m=re.match(r'^([123])([A-L])$',slot)
            if m:
                return group_team_order[m.group(2)][:,int(m.group(1))-1]
            m=re.match(r'^W(\d+)$',slot)
            if m: return kw[:,self.kindex['M'+m.group(1)]]
            m=re.match(r'^L(\d+)$',slot)
            if m: return kl[:,self.kindex['M'+m.group(1)]]
            raise ValueError(slot)
        for ki,m in enumerate(self.kmatches):
            hs,as_=self.ko_slots[m['id']]
            kh[:,ki]=resolve(hs); ka[:,ki]=resolve(as_)
            khs[:,ki],kas[:,ki]=self.draw_scores(kh[:,ki],ka[:,ki],True)
            ph=1/(1+np.exp(-(self.rating[kh[:,ki]]-self.rating[ka[:,ki]])/350.0))
            ph=np.clip(ph,0.28,0.72)
            tie=(khs[:,ki]==kas[:,ki])
            tie_home=self.rng.random(B)<ph
            kw[:,ki]=np.where(khs[:,ki]>kas[:,ki],kh[:,ki],np.where(kas[:,ki]>khs[:,ki],ka[:,ki],np.where(tie_home,kh[:,ki],ka[:,ki]))).astype(np.int16)
            kl[:,ki]=np.where(kw[:,ki]==kh[:,ki],ka[:,ki],kh[:,ki]).astype(np.int16)
        return gh,ga,gw,group_team_order,group_gf_order,group_pts_order,kh,ka,khs,kas,kw,kl
    def score_batch(self,B):
        gh,ga,gw,gt,ggf,gpts,kh,ka,khs,kas,kw,kl=self.simulate_batch(B)
        scores=np.zeros((B,self.P),dtype=np.float32)
        ar=np.arange(B)
        # group match points
        for i in range(len(self.gmatches)):
            scores += (self.p_g_w[:,i][None,:]==gw[:,i,None])*3
            scores += (self.p_g_hs[:,i][None,:]==gh[:,i,None])*np.maximum(2,gh[:,i])[:,None]
            scores += (self.p_g_as[:,i][None,:]==ga[:,i,None])*np.maximum(2,ga[:,i])[:,None]
        # group standings
        for gi,g in enumerate(self.group_letters):
            teams=gt[g]; gf=ggf[g]; pts=gpts[g]
            for pos in range(4):
                scores += (self.p_st_team[:,gi,pos][None,:]==teams[:,pos,None])*4
                scores += (self.p_st_gf[:,gi,pos][None,:]==gf[:,pos,None])*4
                scores += (self.p_st_pts[:,gi,pos][None,:]==pts[:,pos,None])*4
        # stages
        for idxs,teamPts,goalPts,goalMin in self.stage_cfg:
            present=np.zeros((B,self.nteams),dtype=bool)
            for idx in idxs:
                present[ar,kh[:,idx]]=True; present[ar,ka[:,idx]]=True
            for idx in idxs:
                scores += present[:,self.p_k_home[:,idx]]*teamPts
                scores += present[:,self.p_k_away[:,idx]]*teamPts
                scores += (self.p_k_home[:,idx][None,:]==kh[:,idx,None])*teamPts
                scores += (self.p_k_away[:,idx][None,:]==ka[:,idx,None])*teamPts
                if goalMin is not None:
                    scores += (self.p_k_hs[:,idx][None,:]==khs[:,idx,None])*np.maximum(goalMin,khs[:,idx])[:,None]
                    scores += (self.p_k_as[:,idx][None,:]==kas[:,idx,None])*np.maximum(goalMin,kas[:,idx])[:,None]
                else:
                    scores += (self.p_k_hs[:,idx][None,:]==khs[:,idx,None])*goalPts
                    scores += (self.p_k_as[:,idx][None,:]==kas[:,idx,None])*goalPts
        i104=self.kindex['M104']; i103=self.kindex['M103']
        fpres=np.zeros((B,self.nteams),dtype=bool); fpres[ar,kh[:,i104]]=True; fpres[ar,ka[:,i104]]=True
        cpres=np.zeros((B,self.nteams),dtype=bool); cpres[ar,kh[:,i103]]=True; cpres[ar,ka[:,i103]]=True
        scores += fpres[:,self.p_k_home[:,i104]]*15
        scores += fpres[:,self.p_k_away[:,i104]]*15
        scores += cpres[:,self.p_k_home[:,i103]]*12
        scores += cpres[:,self.p_k_away[:,i103]]*12
        scores += (self.p_k_hs[:,i103][None,:]==khs[:,i103,None])*10
        scores += (self.p_k_as[:,i103][None,:]==kas[:,i103,None])*10
        scores += (self.p_k_hs[:,i104][None,:]==khs[:,i104,None])*10
        scores += (self.p_k_as[:,i104][None,:]==kas[:,i104,None])*10
        scores += (self.p_third[None,:]==kw[:,i103,None])*20
        scores += (self.p_fourth[None,:]==kl[:,i103,None])*15
        scores += (self.p_champ[None,:]==kw[:,i104,None])*50
        scores += (self.p_runner[None,:]==kl[:,i104,None])*30
        # Pichichi proxy bonuses: current goals + future team matches in this simulation.
        pichichi_info={'goal_total':None,'top_mask':None,'player_hits':np.zeros((B,self.P),dtype=bool),'goal_hits':np.zeros((B,self.P),dtype=bool)}
        if len(self.pichichi_rows)>0:
            future_games=np.zeros((B,self.nteams),dtype=np.int16)
            for gi in self.unfinished_g_idx:
                future_games[:,self.g_home_ids[gi]] += 1
                future_games[:,self.g_away_ids[gi]] += 1
            for idx in range(len(self.kmatches)):
                future_games[ar,kh[:,idx]] += 1
                future_games[ar,ka[:,idx]] += 1
            scorer_totals=(self.pichichi_current_goals[None,:] + future_games[:,self.pichichi_team_ids]).astype(np.int16)
            max_goal_total=scorer_totals.max(axis=1)
            top_mask=(scorer_totals==max_goal_total[:,None])
            pred_idx_safe=np.where(self.p_top_scorer>=0,self.p_top_scorer,0)
            player_hits=top_mask[:,pred_idx_safe] & (self.p_top_scorer[None,:]>=0)
            goal_hits=(self.p_top_goals[None,:]==max_goal_total[:,None])
            pch=int(self.data.get('rules',{}).get('PCH',15)); gpch=int(self.data.get('rules',{}).get('GPCH',10))
            scores += player_hits*pch
            scores += goal_hits*gpch
            pichichi_info={'goal_total':max_goal_total,'top_mask':top_mask,'player_hits':player_hits,'goal_hits':goal_hits}
        return scores,pichichi_info
    def run(self,n,batch_size=10000):
        win=np.zeros(self.P,dtype=np.float64); top3=np.zeros(self.P,dtype=np.float64); total=np.zeros(self.P,dtype=np.float64); maxp=np.full(self.P,-1,dtype=np.float64)
        pichichi_player_hits=np.zeros(self.P,dtype=np.float64); pichichi_goal_hits=np.zeros(self.P,dtype=np.float64)
        scorer_top_full=np.zeros(len(self.pichichi_rows),dtype=np.float64); scorer_top_share=np.zeros(len(self.pichichi_rows),dtype=np.float64)
        goal_total_counts=Counter()
        done=0
        while done<n:
            B=min(batch_size,n-done)
            scores,pichichi_info=self.score_batch(B)
            total += scores.sum(axis=0)
            maxp = np.maximum(maxp, scores.max(axis=0))
            if pichichi_info['goal_total'] is not None:
                vals,cnts=np.unique(pichichi_info['goal_total'],return_counts=True)
                for v,c in zip(vals,cnts): goal_total_counts[int(v)] += int(c)
                top_mask=pichichi_info['top_mask']
                scorer_top_full += top_mask.sum(axis=0)
                scorer_top_share += (top_mask / top_mask.sum(axis=1)[:,None]).sum(axis=0)
                pichichi_player_hits += pichichi_info['player_hits'].sum(axis=0)
                pichichi_goal_hits += pichichi_info['goal_hits'].sum(axis=0)
            mx=scores.max(axis=1)
            wm=(scores==mx[:,None])
            win += (wm / wm.sum(axis=1)[:,None]).sum(axis=0)
            sorted_scores=np.sort(scores,axis=1)[:,::-1]
            thresh=sorted_scores[:,2]
            above=scores>thresh[:,None]
            equal=scores==thresh[:,None]
            rem=3-above.sum(axis=1)
            top3 += above.sum(axis=0)
            top3 += (equal * (rem/equal.sum(axis=1))[:,None]).sum(axis=0)
            done += B
            print(f'sim {done}', flush=True)
        pch=int(self.data.get('rules',{}).get('PCH',15)); gpch=int(self.data.get('rules',{}).get('GPCH',10))
        rows=[]
        for i,name in enumerate(self.player_names):
            rows.append({
                'Player':name,'WinPct':100*win[i]/n,'Top3Pct':100*top3[i]/n,'AvgPoints':total[i]/n,'MaxPoints':maxp[i],
                'PichichiPlayerPct':100*pichichi_player_hits[i]/n,
                'PichichiGoalsPct':100*pichichi_goal_hits[i]/n,
                'PichichiExpPoints':(pch*pichichi_player_hits[i] + gpch*pichichi_goal_hits[i])/n,
            })
        rows.sort(key=lambda r:(-r['WinPct'],r['Player']))
        for rank,r in enumerate(rows,1): r['Rank']=rank
        pichichi_summary={
            'asOf':self.pichichi_config.get('asOf'),
            'source':self.pichichi_config.get('source'),
            'method':'current_goals_plus_future_team_matches',
            'playerBonusPoints':pch,
            'goalTotalBonusPoints':gpch,
            'goalTotalDistribution':[{'goals':int(g),'pct':round(100*c/n,3)} for g,c in sorted(goal_total_counts.items())],
            'trackedPlayers':[
                {'player':r['name'],'team':r['team'],'currentGoals':int(r['goals']),'topPct':round(100*scorer_top_full[i]/n,3),'tieSplitTopPct':round(100*scorer_top_share[i]/n,3)}
                for i,r in sorted(enumerate(self.pichichi_rows), key=lambda ir:(-scorer_top_full[ir[0]], ir[1]['name']))
            ],
            'missingParticipantPicks':self.pichichi_missing_picks,
        }
        return rows,pichichi_summary

def write_outputs(rows,n,label,outdir,pichichi_summary=None,display_label=None,model_label=None,model_details=None):
    outdir=Path(outdir); outdir.mkdir(parents=True,exist_ok=True)
    csv_path=outdir/f'porra_odds_{label}_{n}.csv'
    with csv_path.open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=['Rank','Player','WinPct','Top3Pct','AvgPoints','MaxPoints','PichichiPlayerPct','PichichiGoalsPct','PichichiExpPoints'])
        w.writeheader()
        for r in rows:
            w.writerow({'Rank':r['Rank'],'Player':r['Player'],'WinPct':round(float(r['WinPct']),3),'Top3Pct':round(float(r['Top3Pct']),3),'AvgPoints':round(float(r['AvgPoints']),1),'MaxPoints':int(r['MaxPoints']),'PichichiPlayerPct':round(float(r.get('PichichiPlayerPct',0)),3),'PichichiGoalsPct':round(float(r.get('PichichiGoalsPct',0)),3),'PichichiExpPoints':round(float(r.get('PichichiExpPoints',0)),2)})
    display=short_names([r['Player'] for r in rows])
    players=[]
    for r in rows:
        dn=display[r['Player']]; aliases=[]
        if dn.endswith('.'): aliases.append(dn[:-1])
        if r['Player']=='Jordi Reig': aliases += ['Jordi Re','Jordi Re.']
        if r['Player']=='Jordi Raventós': aliases += ['Jordi Ra','Jordi Ra.']
        seen=set(); aliases=[a for a in aliases if not (a in seen or seen.add(a))]
        obj={'player':r['Player'],'displayName':dn,'rank':int(r['Rank']),'winPct':round(float(r['WinPct']),3),'top3Pct':round(float(r['Top3Pct']),3),'avgPoints':round(float(r['AvgPoints']),1),'maxPoints':int(r['MaxPoints']),'pichichiPlayerPct':round(float(r.get('PichichiPlayerPct',0)),3),'pichichiGoalsPct':round(float(r.get('PichichiGoalsPct',0)),3),'pichichiExpPoints':round(float(r.get('PichichiExpPoints',0)),2)}
        if aliases: obj['aliases']=aliases
        players.append(obj)
    latest={'generatedAt':datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'label':display_label or f'{label}, {n:,} simulations','model':model_label or 'Monte Carlo amb ranking FIFA, gols limitats a 7, amb bonus de Pichichi proxy','simulations':n,'players':players}
    if model_details is not None:
        latest['modelDetails']=model_details
    if pichichi_summary is not None:
        latest['pichichi']=pichichi_summary
    js='window.PORRA_ODDS_LATEST = '+json.dumps(latest,ensure_ascii=False,indent=2)+';\n'
    latest_js=outdir/'odds_latest.js'; latest_js.write_text(js,encoding='utf-8')
    json_path=outdir/f'porra_odds_{label}_{n}.json'; json_path.write_text(json.dumps(latest,ensure_ascii=False,indent=2),encoding='utf-8')
    hist_js=outdir/f'porra_odds_{label}_{n}.js'; hist_js.write_text(js,encoding='utf-8')
    return csv_path,json_path,latest_js,hist_js

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--data',default='monte_carlo_data.json')
    ap.add_argument('--resultats',default='resultats.js')
    ap.add_argument('--n',type=int,default=100000)
    ap.add_argument('--seed',type=int,default=20260618)
    ap.add_argument('--batch-size',type=int,default=10000)
    ap.add_argument('--label',default=None)
    ap.add_argument('--outdir',default='mc_out')
    ap.add_argument('--pichichi-current',default='pichichi_current.json',help='JSON with current top scorers and participant-pick team hints')
    ap.add_argument('--display-label',default=None,help='Human-readable label for odds_latest.js')
    ap.add_argument('--score-model',choices=['poisson','empirical'],default='poisson',help='Score model for unplayed matches')
    ap.add_argument('--empirical-score-model',default=None,help='JSON model for recent-weighted empirical World Cup scorelines')
    args=ap.parse_args()
    data=json.loads(Path(args.data).read_text(encoding='utf-8'))
    results=parse_resultats_js(args.resultats)
    if not results: raise SystemExit('No final results found')
    label=args.label or datetime.now(timezone.utc).strftime('%Y-%m-%d_%H%M')
    print(f'Loaded {len(data["players"])} players, {len(data["matches"])} matches, {len(results)} finished scores')
    pichichi_config=load_pichichi_config(args.pichichi_current)
    empirical_model=load_empirical_score_model(args.empirical_score_model) if args.score_model=='empirical' else None
    sim=FastMonteCarlo(data,results,args.seed,pichichi_config=pichichi_config,score_model=args.score_model,empirical_score_model=empirical_model)
    rows,pichichi_summary=sim.run(args.n,args.batch_size)
    model_label='Monte Carlo amb ranking FIFA + distribució empírica recent de marcadors dels Mundials, amb bonus de Pichichi proxy' if args.score_model=='empirical' else 'Monte Carlo amb ranking FIFA, gols limitats a 7, amb bonus de Pichichi proxy'
    model_details=None
    if args.score_model=='empirical' and sim.empirical_score_model is not None:
        model_details={'scoreModel':'empirical_recent_weighted_world_cup_scorelines','recencyHalfLifeYears':sim.empirical_score_model['meta'].get('recency_weight_half_life_years'),'baseYear':sim.empirical_score_model['meta'].get('base_year'),'source':sim.empirical_score_model['meta'].get('source'),'groupDrawRatePct':round(100*sim.empirical_score_model['group']['draw_rate'],3),'knockoutDrawRatePct':round(100*sim.empirical_score_model['knockout']['draw_rate'],3)}
    write_outputs(rows,args.n,label,args.outdir,pichichi_summary,display_label=args.display_label,model_label=model_label,model_details=model_details)
    print('Top 10:')
    for r in rows[:10]:
        print(f"{r['Rank']:2d}. {r['Player']}: {r['WinPct']:.3f}% win, {r['Top3Pct']:.3f}% top3, avg {r['AvgPoints']:.1f}")

if __name__=='__main__':
    main()
