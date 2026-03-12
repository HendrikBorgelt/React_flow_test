## CatalysisDataset-001
### Input
```yaml
description:
- Dataset covering preparation of Cu/ZnO/Al2O3 methanol synthesis catalyst by incipient
  wetness impregnation and catalytic performance in CO2 hydrogenation at 50 bar, 200-300
  deg C.
id: coremeta4cat:DS_001_MeOH_synthesis_CuZnO
is_about_entity:
- description: 63 wt% CuO, 24 wt% ZnO, 13 wt% Al2O3 (calcined precursor)
  id: coremeta4cat:CAT_001_CuZnO_Al2O3
  title: Cu/ZnO/Al2O3 methanol synthesis catalyst
title:
- 'Methanol synthesis over Cu/ZnO/Al2O3: synthesis and catalytic performance dataset'
was_generated_by:
- id: coremeta4cat:SYNTH_001_Pt_Al2O3
  title:
  - incipient wetness impregnation of Cu/ZnO/Al2O3
- id: coremeta4cat:CHAR_001_BET_CuZnO_Al2O3
  title:
  - BET surface area measurement of Cu/ZnO/Al2O3
- id: coremeta4cat:CHAR_002_XRD_CuZnO_Al2O3
  title:
  - Powder XRD measurement of Cu/ZnO/Al2O3

```
## CatalysisDataset-002
### Input
```yaml
description:
- 'Dataset covering the full lifecycle of a 15 wt% NiO/CeO2 dry reforming catalyst:
  (1) co-precipitation synthesis with precipitation parameters and calcination protocol;
  (2) XPS surface composition and oxidation state analysis; (3) H2-TPR reducibility
  profiling; (4) catalytic performance in CH4+CO2 dry reforming at 600-800 deg C over
  20 h; (5) ReaxFF molecular dynamics of the Ni/CeO2(111) interface at 800 deg C to
  rationalise metal-support interaction.'
id: coremeta4cat:DS_002_DRM_NiO_CeO2
is_about_entity:
- description: 15 wt% NiO on CeO2 support, co-precipitated at pH 8.5, calcined 500
    deg C / 4 h, active phase Ni0 formed by in situ reduction
  id: coremeta4cat:CAT_002_NiO_CeO2
  title: NiO/CeO2 dry reforming catalyst
- description: 13-atom cuboctahedral Ni cluster on 6-layer CeO2(111) p(4x4) periodic
    slab; ReaxFF MD model representing Ni/CeO2 metal-support interface
  id: coremeta4cat:SLAB_002_CeO2_111_Ni13
  title: Ni13/CeO2(111) computational model
title:
- 'NiO/CeO2 dry methane reforming catalyst: co-precipitation synthesis, multi-technique
  characterization, catalytic performance, and computational interface study'
was_generated_by:
- id: coremeta4cat:SYNTH_002_NiO_CeO2
  title:
  - co-precipitation synthesis of 15 wt% NiO/CeO2
- id: coremeta4cat:CHAR_003_XPS_NiO_CeO2
  title:
  - XPS surface analysis of NiO/CeO2 (Ni 2p, Ce 3d, O 1s)
- id: coremeta4cat:CHAR_004_TPR_NiO_CeO2
  title:
  - H2-TPR reducibility measurement of NiO/CeO2
- id: coremeta4cat:REAC_002_DRM_NiCeO2
  title:
  - dry methane reforming catalytic activity test (600-800 deg C, 20 h)
- id: coremeta4cat:SIM_002_MD_Ni_CeO2_111
  title:
  - ReaxFF MD simulation of Ni13 cluster on CeO2(111) at 800 deg C

```
## Characterization-001
### Input
```yaml
equipment:
- Micromeritics ASAP 2020 surface area and porosimetry analyzer
evaluated_entity:
- description: 63 wt% CuO, 24 wt% ZnO, 13 wt% Al2O3 (calcined precursor)
  id: coremeta4cat:CAT_001_CuZnO_Al2O3
  title: Cu/ZnO/Al2O3 methanol synthesis catalyst
id: coremeta4cat:CHAR_001_BET_CuZnO_Al2O3
realized_plan:
  description: N2 physisorption at 77 K, degassing at 300 deg C for 3 h under vacuum
    prior to measurement
  title: BET surface area measurement

```
## Characterization-002
### Input
```yaml
equipment:
- Bruker D8 Advance diffractometer with Cu K-alpha radiation (1.5406 Ang)
evaluated_entity:
- description: 63 wt% CuO, 24 wt% ZnO, 13 wt% Al2O3 (calcined precursor)
  id: coremeta4cat:CAT_001_CuZnO_Al2O3
  title: Cu/ZnO/Al2O3 methanol synthesis catalyst
id: coremeta4cat:CHAR_002_XRD_CuZnO_Al2O3
realized_plan:
  description: Cu K-alpha, 2theta range 5 to 80 deg, step size 0.02 deg, scan rate
    1 deg/min, Rietveld refinement for phase quantification
  title: powder X-ray diffraction

```
## Characterization-003
### Input
```yaml
detector_type:
- 128-channel 2D delay-line detector (DLD)
equipment:
- Thermo Scientific K-Alpha+ XPS spectrometer
- Al K-alpha monochromatic X-ray source (1486.6 eV, 72 W)
evaluated_entity:
- description: 15 wt% NiO on CeO2 support, calcined at 500 deg C
  id: coremeta4cat:CAT_002_NiO_CeO2
  title: NiO/CeO2 dry reforming catalyst (calcined)
id: coremeta4cat:CHAR_003_XPS_NiO_CeO2
realized_plan:
  description: 'monochromatic Al K-alpha (1486.6 eV); base pressure 5e-9 mbar; survey
    scan: 0-1350 eV, 1.0 eV step, 50 ms dwell, 3 scans, pass energy 200 eV; high-resolution
    regions: Ni 2p3/2 (845-895 eV), Ce 3d (875-935 eV), O 1s (525-540 eV), C 1s (280-295
    eV); step size 0.1 eV, 20 scans each, pass energy 50 eV; spot size 400 um; lens
    mode: large area XL; charge compensation: dual-beam flood gun (1 eV electrons
    + 10 eV Ar+); binding energy scale calibrated to C 1s adventitious carbon at 284.8
    eV; Shirley background subtraction; peak fitting: Voigt profiles (CasaXPS v2.3.25);
    atomic concentrations from Scofield sensitivity factors corrected for transmission
    function'
  title: X-ray photoelectron spectroscopy (XPS)
sample_description:
- NiO/CeO2 co-precipitated catalyst (SYNTH_002), calcined at 500 deg C, as-prepared
  (non-reduced), ca. 10 mg pressed into indium foil
sample_preparation:
- lightly pressed into indium foil to obtain flat surface; mounted on sample stub
  with copper tape; no Ar+ sputtering performed
sample_pretreatment:
- outgassed in XPS load-lock chamber at < 1e-7 mbar for 12 h before transfer to analysis
  chamber (< 5e-9 mbar)
sample_state:
- powder

```
## Characterization-004
### Input
```yaml
detector_type:
- thermal conductivity detector (TCD), Ar carrier gas reference channel
equipment:
- Micromeritics AutoChem II 2920 chemisorption analyzer
evaluated_entity:
- description: 15 wt% NiO on CeO2, calcined at 500 deg C / 4 h
  id: coremeta4cat:CAT_002_NiO_CeO2
  title: NiO/CeO2 dry reforming catalyst (calcined)
id: coremeta4cat:CHAR_004_TPR_NiO_CeO2
realized_plan:
  description: 'reducing gas: 5 vol% H2/Ar, total flow 50 mL/min (calibrated Brooks
    MFC); temperature programme: 50 deg C to 900 deg C at 10 deg C/min; isothermal
    hold: 30 min at 900 deg C; H2O trap: molecular sieve 3A between reactor outlet
    and TCD to prevent TCD signal interference; baseline: Ar flow for 30 min at 50
    deg C before switching to H2/Ar; H2 consumption quantified by integration of TCD
    signal, calibrated against CuO reference standard (99.9%, 10 mg, single reduction
    peak at 310 deg C); NiO reduction: expected peaks at 280-350 deg C (NiO weakly
    interacting with CeO2) and 400-600 deg C (NiO strongly interacting); CeO2 surface
    reduction: 600-900 deg C'
  title: H2 temperature-programmed reduction (H2-TPR)
sample_description:
- NiO/CeO2 calcined at 500 deg C; 50 mg packed in quartz U-tube reactor (4 mm ID);
  quartz wool plugs above and below bed
sample_pretreatment:
- 'oxidative pretreatment: 10 vol% O2/Ar (50 mL/min) at 300 deg C for 30 min; cool
  to 50 deg C under Ar purge'

```
## Reaction-001
### Input
```yaml
atmosphere:
- H2/CO2 = 3:1 (molar), GHSV = 10000 mL/(g*h)
carried_out_by:
- description: 10 mm inner diameter, 30 cm length, 0.5 g catalyst diluted with SiC
  id: coremeta4cat:REACT_001_FixedBed
  title: stainless steel fixed-bed plug-flow reactor
catalyst_quantity:
- 0.5
catalyst_type:
- heterogeneous, supported metal oxide
experiment_pressure:
- 50.0
feed_composition_range:
- H2/CO2 = 3:1, CO2 concentration 20 vol%
had_input_entity:
- description: H2/CO2 molar ratio 3:1, total flow 100 mL/min
  id: coremeta4cat:FEED_001_CO2_H2
  title: CO2/H2 feed gas mixture
id: coremeta4cat:REAC_001_CO2_hydrogenation
product_identification_method:
- description: 'GC (Agilent 7890B) with TCD and FID detectors; columns: Molecular
    Sieve 5A and Poraplot Q; products: MeOH, CO, CH4, H2O quantified'
  title: online gas chromatography
reactant:
- CO2 (99.998% purity, 20 vol% in H2)
- H2 (99.999% purity)
reactor_temperature_range:
- 200-300 deg C

```
## Reaction-002
### Input
```yaml
atmosphere:
- CH4/CO2/N2 = 45:45:10 vol%, total flow 100 mL/min (STP), GHSV = 30000 mL/(g*h)
carried_out_by:
- description: 'quartz tube reactor, 8 mm inner diameter, 30 cm length; catalyst bed:
    200 mg NiO/CeO2 (250-500 um sieve fraction) diluted 1:2 (mass) with inert SiC
    chips (500 um); thermocouple inserted into catalyst bed centre; backpressure regulator
    at outlet (1 bar); reactor surrounded by ceramic-fibre furnace with PID temperature
    controller; mass flow controllers (Brooks SLA5850) for CH4, CO2, N2'
  id: coremeta4cat:REACT_003_FixedBed_DRM
  title: quartz fixed-bed plug-flow reactor (DRM)
catalyst_quantity:
- 0.2
catalyst_type:
- heterogeneous, supported metal (Ni0 after in situ reduction of NiO/CeO2)
experiment_duration:
- 20.0
experiment_pressure:
- 1.0
feed_composition_range:
- 'stoichiometric DRM: CH4/CO2 = 1:1 (molar)'
- 'CO2-rich condition: CH4/CO2 = 1:1.5 to suppress carbon deposition'
had_input_entity:
- description: 'CH4 flow: 45 mL/min (STP); calibrated Brooks SLA5850 MFC'
  id: coremeta4cat:FEED_004_CH4_DRM
  title: methane feed (99.995%, Linde)
- description: 'CO2 flow: 45 mL/min (STP); calibrated Brooks SLA5850 MFC'
  id: coremeta4cat:FEED_005_CO2_DRM
  title: CO2 feed (99.998%, Linde)
- description: 'N2 flow: 10 mL/min (STP); used as internal standard for GC molar balance'
  id: coremeta4cat:FEED_006_N2_standard
  title: N2 internal standard (99.999%, Linde)
id: coremeta4cat:REAC_002_DRM_NiCeO2
product_identification_method:
- description: 'Shimadzu GC-2014 with TCD detector (Ar carrier gas); column 1: HayeSep
    D (2 m x 1/8 in) for CO2, CH4 separation; column 2: Molecular Sieve 5A (2 m x
    1/8 in) for CO, H2, N2, CH4 separation; 10-port Valco valve for column switching;
    oven temperature: 50 deg C isothermal; TCD temperature: 250 deg C; injection:
    automated gas sampling valve, 1 mL loop; analysis cycle: 10 min; calibration:
    certified gas standard (Air Liquide CRYSTAL mixture: H2 5%, CO 5%, CH4 5%, CO2
    10%, N2 balance); CH4 conversion, CO2 conversion, H2/CO ratio, and carbon balance
    calculated from N2-normalised molar flows'
  title: online dual-column gas chromatography (TCD)
reactant:
- CH4 (99.995% purity, Linde)
- CO2 (99.998% purity, Linde)
- N2 balance (99.999% purity, internal standard for GC quantification)
reactor_temperature_range:
- 600-800 deg C

```
## Simulation-001
### Input
```yaml
calculated_property:
- description: CO adsorption energy on hollow fcc site of Cu(111) relative to gas-phase
    CO
  value: -0.67 eV
- description: C-O bond length of adsorbed CO
  value: 1.157 Ang
- description: Cu-C bond length at hollow adsorption site
  value: 2.312 Ang
evaluated_entity:
- description: 4-layer Cu(111) p(3x3) slab, bottom 2 layers fixed, 15 Ang vacuum
  id: coremeta4cat:SLAB_001_Cu111
  title: Cu(111) surface slab model
id: coremeta4cat:SIM_001_DFT_Cu111_CO_ads
realized_plan:
  description: PBE functional, PAW pseudopotentials, 400 eV cutoff, 4x4x1 Monkhorst-Pack
    k-mesh, D3 dispersion correction, spin-unpolarized
  title: periodic plane-wave DFT
software_package:
- VASP 6.3.0
- VESTA 3.5.8 (structure visualization)

```
## Simulation-002
### Input
```yaml
calculated_property:
- description: CeO2(111) cleavage surface energy (clean slab without Ni cluster, computed
    from relaxed DFT-D3 reference at 0 K, used as force field validation benchmark)
  value: 1.52 J/m2
- description: time-averaged Ni-CeO2 adhesion energy per Ni atom (13-atom cluster)
    relative to bulk Ni cohesive energy and clean CeO2(111) slab; computed from 800
    ps production trajectory
  value: -1.83 eV/atom
- description: first-shell Ni-O coordination distance at Ni cluster / CeO2 interface
    (peak of Ni-O radial distribution function, production trajectory average)
  value: 3.8 Ang
- description: fraction of Ni atoms in direct contact with CeO2 surface (Ni-O bond
    order > 0.3) averaged over production trajectory; measures cluster wetting / spreading
  value: '0.42'
evaluated_entity:
- description: 6-layer CeO2(111) p(4x4) slab (256 CeO2 formula units, 768 atoms total);
    bottom 3 layers fixed during MD; 13-atom cuboctahedral Ni cluster adsorbed on
    three-fold hollow O site; 20 Ang vacuum layer; 3D periodic boundary conditions
  id: coremeta4cat:SLAB_002_CeO2_111_Ni13
  title: CeO2(111) surface slab with supported 13-atom Ni cluster
id: coremeta4cat:SIM_002_MD_Ni_CeO2_111
realized_plan:
  description: 'force field: ReaxFF C/H/Ni/O parametrisation (van Duin et al. 2012,
    DOI: 10.1021/jp210484t); ensemble: NVT with Nose-Hoover thermostat (tau = 100
    fs) at 800 deg C (1073 K); integration timestep: 0.5 fs; total simulation time:
    1 ns (2,000,000 steps); equilibration phase: 200 ps (400,000 steps) discarded;
    production phase: 800 ps (1,600,000 steps) used for analysis; sampling interval:
    every 1000 steps (0.5 ps); bond order cutoff: C-O 0.3, Ni-O 0.3 (fix reax/c/bonds);
    radial distribution functions computed with OVITO using 0.05 Ang bin width; common-neighbour
    analysis (CNA) to track Ni cluster crystallographic ordering'
  title: ReaxFF molecular dynamics (NVT, 800 deg C)
software_package:
- LAMMPS (29 Sep 2021 stable release, OpenMP build)
- OVITO 3.7.11 (structure analysis, RDF, CNA, cluster tracking)

```
## Synthesis-001
### Input
```yaml
catalyst_measured_properties:
- 'BET surface area: 185 m2/g, Pt particle size: 2.3 nm (TEM), Pt loading: 4.8 wt%
  (ICP-AES)'
had_input_entity:
- id: coremeta4cat:PREC_001_H2PtCl6
  precursor_quantity:
  - 0.0485
  title: chloroplatinic acid hexahydrate
id: coremeta4cat:SYNTH_001_Pt_Al2O3
nominal_composition:
- 5 wt% Pt/Al2O3
realized_plan:
  description: incipient_wetness, 25 deg C, 12 h
  title: incipient wetness impregnation
sample_pretreatment:
- reduction in H2 at 400 deg C for 2 hours prior to catalytic testing
solvent:
- deionized water
storage_conditions:
- stored in desiccator under argon atmosphere at room temperature
support:
- gamma-Al2O3, Sasol Puralox, 200 m2/g

```
## Synthesis-002
### Input
```yaml
catalyst_measured_properties:
- 'BET surface area: 42 m2/g'
- 'NiO crystallite size: 8.4 nm (Scherrer, XRD)'
- 'Ni loading: 14.7 wt% (ICP-AES)'
- 'reducibility onset: 280 deg C, completion at 600 deg C (H2-TPR)'
had_input_entity:
- id: coremeta4cat:PREC_004_Ni_NO3_6H2O
  precursor_quantity:
  - 8.72
  title: nickel(II) nitrate hexahydrate (Sigma-Aldrich, purity 99%)
- id: coremeta4cat:PREC_005_Ce_NO3_6H2O
  precursor_quantity:
  - 13.03
  title: cerium(III) nitrate hexahydrate (Sigma-Aldrich, purity 99.5%)
- id: coremeta4cat:PREC_006_Na2CO3
  precursor_quantity:
  - 5.3
  title: sodium carbonate precipitating agent (anhydrous, Sigma-Aldrich, purity 99.5%)
had_output_entity:
- description: 15 wt% NiO on CeO2 support, co-precipitated at pH 8.5, calcined 500
    deg C / 4 h, sieved to 250-500 um
  id: coremeta4cat:CAT_002_NiO_CeO2
  title: NiO/CeO2 dry reforming catalyst (calcined precursor)
id: coremeta4cat:SYNTH_002_NiO_CeO2
nominal_composition:
- 15 wt% NiO/CeO2
realized_plan:
  description: 'aqueous solutions of Ni(NO3)2 (0.5 M) and Ce(NO3)3 (0.5 M) mixed in
    stoichiometric ratio; precipitant: 1 M Na2CO3 solution added dropwise at 2 mL/min;
    target pH 8.5 maintained by feedback addition; mixing: 600 rpm mechanical stirring
    at 60 deg C for 2 h; aging: 12 h at 60 deg C without stirring; filtration: vacuum
    filtration through Whatman grade 4 filter paper; washing: 5 successive deionized
    water washes until conductivity < 5 uS/cm (Na+ removal); drying: 120 deg C for
    12 h in static air oven; calcination: 5 deg C/min ramp to 500 deg C, isothermal
    hold for 4 h in static air, natural cooling'
  title: co-precipitation
sample_pretreatment:
- 'in situ reduction: 5 vol% H2/N2 at 700 deg C for 1 h (10 deg C/min ramp) before
  DRM tests'
solvent:
- deionized water (18.2 MOhm cm, MilliQ)
storage_conditions:
- sealed glass vial in desiccator, ambient temperature, protected from moisture

```
