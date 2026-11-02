"""Literature evidence base (v0.2).

Each entry anchors a model quantity to a published value. `mapping` grades the link:
  "direct"     - the number enters the model as-is (regime protocols, timing windows)
  "scaled"     - same quantity, different unit or scale
  "conceptual" - same biological construct, but no quantitative transfer is claimed
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class Evidence:
    key: str
    value: str
    source: str
    year: int
    maps_to: str
    mapping: str
    note: str = ""


LITERATURE = [
    Evidence("elbow_flexion_aROM", "146 deg", "Zwerus et al., Shoulder & Elbow 9(4)", 2017,
             "regimes/THETA0", "conceptual",
             "normal aROM flexion in 352 elbows; model slack angle is a construct, not this number"),
    Evidence("elbow_flexion_pROM", "~150 deg", "Zwerus et al., Shoulder & Elbow 9(4)", 2017,
             "regimes/THETA0", "conceptual", "pROM 3-5 deg beyond aROM"),
    Evidence("functional_arc", "30-130 deg", "Sardelli et al. 2011 (via Physio-pedia)", 2011,
             "regimes", "direct", "ADL-sufficient arc; context for interpreting c_B loss"),
    Evidence("mechanostat_MESm", "1000-1500 microstrain", "Frost, Anat Rec 275A(4):1081", 2003,
             "eps_th", "conceptual", "bone modeling threshold"),
    Evidence("mechanostat_MESp", "~3000 microstrain", "Frost, Anat Rec 275A(4):1081", 2003,
             "eps_th", "conceptual",
             "bone microdamage threshold; conceptual only - the model's soft-tissue strain scale differs"),
    Evidence("HO_onset", "1-2 wks osteoid; 4-6 wks radiographic haze", "Casavant & Hastings, J Hand Ther 19(2)", 2006,
             "k_I/horizon", "scaled", "anchors the early inflammatory window (~6 weeks)"),
    Evidence("HO_maturation", "3-9 months", "Casavant & Hastings, J Hand Ther 19(2)", 2006,
             "horizon", "direct", "justifies the 180-day simulation horizon"),
    Evidence("HO_incidence_dislocation", "3%", "Thompson et al. (reviewed in ScienceDirect HO overview)", 2010,
             "context", "direct", "simple elbow dislocation"),
    Evidence("HO_incidence_fracture", "49%", "Ilahi et al. (reviewed in ScienceDirect HO overview)", 2010,
             "context", "direct", "elbow fractures; 20% symptomatic; 58% in terrible triad"),
    Evidence("michelsson_protocol",
             "immobilization in extension + daily ~5 min forceful manipulation; HO in 2-5 wks",
             "Michelsson & Rauschning, Clin Orthop 176:265, PMID 6406124", 1983,
             "regime:animal_forced", "direct",
             "incidence scales with immobilization duration x manipulation frequency"),
    Evidence("cpm_no_progression", "CPM 70 deg arc (40-110), 45 s cycle, 24 h/day, 2 wks - no HO progression",
             "van Susante et al., Acta Orthop Scand 67(4):450", 1996,
             "regime:passive_clinical", "direct",
             "gentle below-pain-threshold motion does not drive bone formation"),
]
