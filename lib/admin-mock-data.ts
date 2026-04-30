// ============================================================================
// INSW Admin Panel - Mock Data Module
// ============================================================================
// This module exports typed mock data for the admin experience.
// It does not modify any existing crew mock data; admin can read from the
// same sources but adds its own data structures.
// ============================================================================

// ----------------------------------------------------------------------------
// Type Definitions
// ----------------------------------------------------------------------------

export interface TargetSystem {
  id: string
  name: string
}

export interface TargetForm {
  id: string
  targetSystemId: string
  name: string
}

export interface Vessel {
  id: string
  name: string
  imo: string
  targetSystemIds: string[]
  assignedCrewUserIds: string[]
}

export interface CrewUser {
  id: string
  name: string
  email: string
  vesselId: string
  role: 'master' | 'chief_officer' | 'second_officer'
}

export interface ValidationRule {
  id: string
  kind: 'sum_equals' | 'between' | 'regex' | 'enum' | 'cross_field_equals' | 'expression'
  config: Record<string, unknown>
  severity: 'block' | 'warn'
}

export interface FieldDefinition {
  id: string
  targetSystemId: string
  logicalName: string
  name: string
  appearsOnFormIds: string[]
  navtorSourcePaths: string[]
  aggregateAcrossReports?: boolean
  dataType: 'number' | 'text' | 'datetime' | 'enum' | 'latlong' | 'duration'
  unit?: string
  isCritical: boolean
  isMandatory: boolean
  isCalculated: boolean
  isReadOnlyInTarget?: boolean
  formula?: string
  extractionHint: string
  navtorSourcePath?: string
  validationRules: ValidationRule[]
  advancedExpression?: string
  advancedExpressionSeverity?: 'block' | 'warn'
  version: number
  updatedAt: string
  updatedBy: string
}

export interface Flag {
  id: string
  fieldDefinitionId: string
  reportId: string
  vesselId: string
  crewUserId: string
  flaggedValue: string
  sourceValue: string
  reason: 'incorrect_value' | 'wrong_source' | 'missing' | 'other'
  comment?: string
  flaggedAt: string
  status: 'open' | 'fixed'
  reportStatus: 'submitted' | 'draft'
}

export interface TestRun {
  id: string
  fieldDefinitionId: string
  reportId: string
  expectedValue: string
  runs: number[]
  correctCount: number
  totalRuns: number
  definitionVersion: number
  ranAt: string
}

export interface DefinitionChange {
  id: string
  fieldDefinitionId: string
  fromVersion: number
  toVersion: number
  changedBy: string
  changedAt: string
  diffSummary: string
}

export interface Submission {
  id: string
  vesselId: string
  formId: string
  submittedAt: string
  submittedBy: string
  criticalVerifiedCount: number
  criticalTotalCount: number
  fieldsVerified: number
  fieldsFlagged: number
}

// ----------------------------------------------------------------------------
// Target Systems
// ----------------------------------------------------------------------------

export const targetSystems: TargetSystem[] = [
  { id: 'veslink', name: 'VesLink' }
]

// ----------------------------------------------------------------------------
// Target Forms (7 VesLink forms)
// ----------------------------------------------------------------------------

export const targetForms: TargetForm[] = [
  { id: 'noon-sea', targetSystemId: 'veslink', name: 'Noon (Sea)' },
  { id: 'noon-port', targetSystemId: 'veslink', name: 'Noon (Port)' },
  { id: 'arrival', targetSystemId: 'veslink', name: 'Arrival' },
  { id: 'departure', targetSystemId: 'veslink', name: 'Departure' },
  { id: 'bunkering', targetSystemId: 'veslink', name: 'Bunkering' },
  { id: 'cargo-handling', targetSystemId: 'veslink', name: 'Cargo Handling' },
  { id: 'sof', targetSystemId: 'veslink', name: 'Statement of Facts' },
]

// ----------------------------------------------------------------------------
// Vessels (84 tankers with realistic names and IMO numbers)
// ----------------------------------------------------------------------------

const vesselNames = [
  'Seaways Skopelos', 'Seaways Andromeda', 'Seaways Titan', 'Seaways Horizon',
  'Seaways Voyager', 'Seaways Pioneer', 'Seaways Guardian', 'Seaways Endeavor',
  'Seaways Navigator', 'Seaways Explorer', 'Seaways Venture', 'Seaways Spirit',
  'Seaways Progress', 'Seaways Triumph', 'Seaways Victory', 'Seaways Fortuna',
  'Seaways Destiny', 'Seaways Legacy', 'Seaways Meridian', 'Seaways Zenith',
  'Seaways Eclipse', 'Seaways Aurora', 'Seaways Phoenix', 'Seaways Atlas',
  'Seaways Hercules', 'Seaways Orion', 'Seaways Polaris', 'Seaways Neptune',
  'Seaways Poseidon', 'Seaways Triton', 'Seaways Aegean', 'Seaways Baltic',
  'Seaways Caspian', 'Seaways Adriatic', 'Seaways Pacific', 'Seaways Atlantic',
  'Seaways Indian', 'Seaways Arctic', 'Seaways Caribbean', 'Seaways Mediterranean',
  'Seaways Sovereign', 'Seaways Majestic', 'Seaways Imperial', 'Seaways Royal',
  'Seaways Noble', 'Seaways Regal', 'Seaways Crown', 'Seaways Monarch',
  'Seaways Dynasty', 'Seaways Empire', 'Seaways Valor', 'Seaways Courage',
  'Seaways Intrepid', 'Seaways Resolute', 'Seaways Stalwart', 'Seaways Steadfast',
  'Seaways Dauntless', 'Seaways Fearless', 'Seaways Bold', 'Seaways Brave',
  'Seaways Liberty', 'Seaways Freedom', 'Seaways Independence', 'Seaways Unity',
  'Seaways Harmony', 'Seaways Concord', 'Seaways Alliance', 'Seaways Union',
  'Seaways Prosperity', 'Seaways Fortune', 'Seaways Wealth', 'Seaways Bounty',
  'Seaways Abundance', 'Seaways Treasure', 'Seaways Jewel', 'Seaways Pearl',
  'Seaways Diamond', 'Seaways Sapphire', 'Seaways Emerald', 'Seaways Ruby',
  'Seaways Opal', 'Seaways Jade', 'Seaways Amber', 'Seaways Topaz',
]

// Generate 84 vessels
export const vessels: Vessel[] = vesselNames.map((name, index) => ({
  id: `vessel-${String(index + 1).padStart(3, '0')}`,
  name: name.toUpperCase(),
  imo: `${9100000 + index * 117}`, // IMO numbers starting from 9100000
  targetSystemIds: ['veslink'],
  assignedCrewUserIds: [], // Will be populated after crew users are generated
}))

// ----------------------------------------------------------------------------
// Crew Users (1-3 per vessel)
// ----------------------------------------------------------------------------

const firstNames = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark',
  'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian',
  'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan',
  'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin',
  'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Raymond', 'Gregory', 'Frank',
  'Alexander', 'Patrick', 'Jack', 'Dennis', 'Jerry'
]

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
  'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
  'Campbell', 'Mitchell', 'Carter', 'Roberts'
]

const roles: Array<'master' | 'chief_officer' | 'second_officer'> = ['master', 'chief_officer', 'second_officer']

let crewUserIdCounter = 1
export const crewUsers: CrewUser[] = []

vessels.forEach((vessel, vesselIndex) => {
  // Assign 1-3 crew users per vessel (weighted toward 2-3)
  const crewCount = vesselIndex % 5 === 0 ? 1 : vesselIndex % 3 === 0 ? 2 : 3
  
  for (let i = 0; i < crewCount; i++) {
    const firstName = firstNames[(vesselIndex * 3 + i) % firstNames.length]
    const lastName = lastNames[(vesselIndex * 7 + i) % lastNames.length]
    const role = roles[i % roles.length]
    const userId = `crew-${String(crewUserIdCounter++).padStart(4, '0')}`
    
    crewUsers.push({
      id: userId,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@seaways.com`,
      vesselId: vessel.id,
      role,
    })
    
    vessel.assignedCrewUserIds.push(userId)
  }
})

// ----------------------------------------------------------------------------
// Field Definitions (~30 per form with overlap, deduped by target system)
// Field definitions are scoped per target system, NOT per form.
// ----------------------------------------------------------------------------

const fieldDefinitionData: Array<{
  logicalName: string
  appearsOnForms: string[]
  dataType: FieldDefinition['dataType']
  unit?: string
  isCritical: boolean
  isMandatory: boolean
  isCalculated: boolean
  formula?: string
  navtorPaths: string[]
  extractionHint: string
  validationRules?: ValidationRule[]
}> = [
  // Common fields appearing on multiple forms
  {
    logicalName: 'Date/Time',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure', 'bunkering', 'cargo-handling', 'sof'],
    dataType: 'datetime',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.general.reportDate', 'voyageReporting.general.reportTime'],
    extractionHint: 'Report date and time in UTC. Combine date and time fields from NAVTOR General tab.',
  },
  {
    logicalName: 'Voyage Number',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure', 'bunkering', 'cargo-handling', 'sof'],
    dataType: 'text',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.general.voyageNumber'],
    extractionHint: 'Voyage number from NAVTOR General tab.',
  },
  {
    logicalName: 'Vessel Condition',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'enum',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.general.vesselCondition'],
    extractionHint: 'Vessel condition: Laden, Ballast, or Part Laden.',
    validationRules: [{
      id: 'vr-vessel-condition-enum',
      kind: 'enum',
      config: { values: ['Laden', 'Ballast', 'Part Laden'] },
      severity: 'block'
    }]
  },
  {
    logicalName: 'Next Port',
    appearsOnForms: ['noon-sea', 'noon-port', 'departure'],
    dataType: 'text',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.general.nextPort'],
    extractionHint: 'Next port of call from NAVTOR General tab.',
  },
  {
    logicalName: 'ETA',
    appearsOnForms: ['noon-sea', 'noon-port', 'departure'],
    dataType: 'datetime',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.general.eta'],
    extractionHint: 'Estimated time of arrival at next port.',
  },
  {
    logicalName: 'Latitude',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'latlong',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.position.latitude'],
    extractionHint: 'Current latitude in degrees, minutes, seconds format with N/S indicator.',
  },
  {
    logicalName: 'Longitude',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'latlong',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.position.longitude'],
    extractionHint: 'Current longitude in degrees, minutes, seconds format with E/W indicator.',
  },
  // Distance & Speed fields
  {
    logicalName: 'Distance to Go',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    unit: 'nm',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.distanceAndSpeed.distanceToGo'],
    extractionHint: 'Distance remaining to next port in nautical miles.',
    validationRules: [{
      id: 'vr-dtg-range',
      kind: 'between',
      config: { min: 0, max: 15000 },
      severity: 'warn'
    }]
  },
  {
    logicalName: 'CP / Ordered Speed',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    unit: 'kts',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.distanceAndSpeed.orderedSpeed'],
    extractionHint: 'Charter party ordered speed in knots.',
    validationRules: [{
      id: 'vr-cp-speed-range',
      kind: 'between',
      config: { min: 5, max: 25 },
      severity: 'warn'
    }]
  },
  {
    logicalName: 'Reported Speed',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    unit: 'kts',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.distanceAndSpeed.reportedSpeed'],
    extractionHint: 'Reported speed in knots. Found in Distance & Speed tab.',
    validationRules: [{
      id: 'vr-rep-speed-range',
      kind: 'between',
      config: { min: 0, max: 30 },
      severity: 'warn'
    }]
  },
  {
    logicalName: 'Observed Distance',
    appearsOnForms: ['noon-sea'],
    dataType: 'number',
    unit: 'nm',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: [], // Manual fill - not in NAVTOR
    extractionHint: 'MANUAL FILL: Observed distance from ship log. Not available in NAVTOR.',
  },
  {
    logicalName: 'Engine Distance',
    appearsOnForms: ['noon-sea'],
    dataType: 'number',
    unit: 'nm',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: [], // Manual fill
    extractionHint: 'MANUAL FILL: Engine distance from engine room log. Not available in NAVTOR.',
  },
  {
    logicalName: 'Time Since Last Report',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'duration',
    unit: 'hrs',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.distanceAndSpeed.timeSinceLastReport'],
    extractionHint: 'Hours since last report was submitted.',
    validationRules: [{
      id: 'vr-tslr-range',
      kind: 'between',
      config: { min: 0, max: 48 },
      severity: 'warn'
    }]
  },
  // Machinery fields
  {
    logicalName: 'Main Engine RPM',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['machinery.mainEngine.rpm'],
    extractionHint: 'Main engine revolutions per minute from Machinery tab.',
    validationRules: [{
      id: 'vr-me-rpm-range',
      kind: 'between',
      config: { min: 0, max: 150 },
      severity: 'warn'
    }]
  },
  {
    logicalName: 'Generator 1 Hours',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'number',
    unit: 'hrs',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['machinery.generators.gen1.hours'],
    extractionHint: 'Generator 1 running hours since last report.',
  },
  {
    logicalName: 'Generator 2 Hours',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'number',
    unit: 'hrs',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['machinery.generators.gen2.hours'],
    extractionHint: 'Generator 2 running hours since last report.',
  },
  {
    logicalName: 'Generator 3 Hours',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'number',
    unit: 'hrs',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['machinery.generators.gen3.hours'],
    extractionHint: 'Generator 3 running hours since last report.',
  },
  {
    logicalName: 'Boiler Hours',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    unit: 'hrs',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['machinery.boiler.hours'],
    extractionHint: 'Boiler running hours since last report.',
  },
  // Weather fields
  {
    logicalName: 'Beaufort',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'enum',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.weather.beaufort'],
    extractionHint: 'Beaufort wind scale (0-12).',
    validationRules: [{
      id: 'vr-beaufort-enum',
      kind: 'enum',
      config: { values: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] },
      severity: 'block'
    }]
  },
  {
    logicalName: 'Wind Direction',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'enum',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.weather.windDirection'],
    extractionHint: 'Wind direction as compass bearing.',
    validationRules: [{
      id: 'vr-wind-dir-enum',
      kind: 'enum',
      config: { values: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] },
      severity: 'warn'
    }]
  },
  {
    logicalName: 'Sea State',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'enum',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: [], // Manual fill
    extractionHint: 'MANUAL FILL: Sea state on Douglas scale. Visual observation by watch officer.',
  },
  {
    logicalName: 'Sea Height',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    unit: 'm',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['voyageReporting.weather.seaHeight'],
    extractionHint: 'Sea height in meters.',
  },
  {
    logicalName: 'Sea Temperature',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    unit: '°C',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['voyageReporting.weather.seaTemperature'],
    extractionHint: 'Sea water temperature in degrees Celsius.',
  },
  // Bunker ROB fields
  {
    logicalName: 'IFO ROB',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure', 'bunkering'],
    dataType: 'number',
    unit: 'MT',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['bunkers.ifo.rob'],
    extractionHint: 'Intermediate Fuel Oil remaining on board in metric tons.',
    validationRules: [{
      id: 'vr-ifo-range',
      kind: 'between',
      config: { min: 0, max: 5000 },
      severity: 'warn'
    }]
  },
  {
    logicalName: 'MGO ROB',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure', 'bunkering'],
    dataType: 'number',
    unit: 'MT',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['bunkers.mgo.rob'],
    extractionHint: 'Marine Gas Oil remaining on board in metric tons.',
    validationRules: [{
      id: 'vr-mgo-range',
      kind: 'between',
      config: { min: 0, max: 2000 },
      severity: 'warn'
    }]
  },
  {
    logicalName: 'LSFO ROB',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure', 'bunkering'],
    dataType: 'number',
    unit: 'MT',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['bunkers.lsfo.rob'],
    extractionHint: 'Low Sulphur Fuel Oil remaining on board in metric tons.',
  },
  {
    logicalName: 'LSMGO ROB',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure', 'bunkering'],
    dataType: 'number',
    unit: 'MT',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['bunkers.lsmgo.rob'],
    extractionHint: 'Low Sulphur Marine Gas Oil remaining on board in metric tons.',
  },
  // Bunker Consumption fields
  {
    logicalName: 'IFO Total Consumption',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    unit: 'MT',
    isCritical: true,
    isMandatory: true,
    isCalculated: true,
    formula: '${ifo-main-consumption} + ${ifo-aux-consumption}',
    navtorPaths: ['bunkers.ifo.consumption.total'],
    extractionHint: 'Total IFO consumption = Main Engine + Auxiliary. Calculated field.',
    validationRules: [{
      id: 'vr-ifo-total-sum',
      kind: 'sum_equals',
      config: { 
        fields: ['ifo-main-consumption', 'ifo-aux-consumption'],
        targetField: 'ifo-total-consumption'
      },
      severity: 'block'
    }]
  },
  {
    logicalName: 'IFO Main Engine Consumption',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    unit: 'MT',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['bunkers.ifo.consumption.mainEngine'],
    extractionHint: 'IFO consumed by main engine since last report.',
  },
  {
    logicalName: 'IFO Auxiliary Consumption',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    unit: 'MT',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['bunkers.ifo.consumption.auxiliary'],
    extractionHint: 'IFO consumed by auxiliary engines since last report.',
  },
  {
    logicalName: 'MGO Total Consumption',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    unit: 'MT',
    isCritical: true,
    isMandatory: true,
    isCalculated: true,
    formula: '${mgo-main-consumption} + ${mgo-aux-consumption}',
    navtorPaths: ['bunkers.mgo.consumption.total'],
    extractionHint: 'Total MGO consumption = Main Engine + Auxiliary. Calculated field.',
  },
  {
    logicalName: 'MGO Main Engine Consumption',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    unit: 'MT',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['bunkers.mgo.consumption.mainEngine'],
    extractionHint: 'MGO consumed by main engine since last report.',
  },
  {
    logicalName: 'MGO Auxiliary Consumption',
    appearsOnForms: ['noon-sea', 'noon-port'],
    dataType: 'number',
    unit: 'MT',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['bunkers.mgo.consumption.auxiliary'],
    extractionHint: 'MGO consumed by auxiliary engines since last report.',
  },
  // Water fields
  {
    logicalName: 'Fresh Water ROB',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'number',
    unit: 'MT',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['stock.freshWater.rob'],
    extractionHint: 'Fresh water remaining on board in metric tons.',
  },
  {
    logicalName: 'Distilled Water ROB',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'number',
    unit: 'MT',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['stock.distilledWater.rob'],
    extractionHint: 'Distilled water remaining on board in metric tons.',
  },
  {
    logicalName: 'Slops ROB',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'number',
    unit: 'MT',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['stock.slops.rob'],
    extractionHint: 'Slops remaining on board in metric tons.',
  },
  // Draft fields
  {
    logicalName: 'Forward Draft',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'number',
    unit: 'm',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.vessel.draughtForward'],
    extractionHint: 'Forward draft in meters.',
    validationRules: [{
      id: 'vr-fwd-draft-range',
      kind: 'between',
      config: { min: 5, max: 25 },
      severity: 'warn'
    }]
  },
  {
    logicalName: 'Mid Draft',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'number',
    unit: 'm',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['voyageReporting.vessel.draughtMid'],
    extractionHint: 'Mid draft in meters.',
  },
  {
    logicalName: 'Aft Draft',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'number',
    unit: 'm',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.vessel.draughtAft'],
    extractionHint: 'Aft draft in meters.',
    validationRules: [{
      id: 'vr-aft-draft-range',
      kind: 'between',
      config: { min: 5, max: 25 },
      severity: 'warn'
    }]
  },
  {
    logicalName: 'Displacement',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'number',
    unit: 't',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['voyageReporting.vessel.displacement'],
    extractionHint: 'Vessel displacement in tonnes.',
  },
  {
    logicalName: 'Ballast',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure'],
    dataType: 'number',
    unit: 'MT',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['voyageReporting.vessel.ballast'],
    extractionHint: 'Ballast water on board in metric tons.',
  },
  {
    logicalName: 'Slip',
    appearsOnForms: ['noon-sea'],
    dataType: 'number',
    unit: '%',
    isCritical: false,
    isMandatory: false,
    isCalculated: true,
    formula: '((${engine-distance} - ${observed-distance}) / ${engine-distance}) * 100',
    navtorPaths: [],
    extractionHint: 'Calculated: ((Engine Distance - Observed Distance) / Engine Distance) * 100',
  },
  // Arrival-specific fields
  {
    logicalName: 'Arrival Port',
    appearsOnForms: ['arrival'],
    dataType: 'text',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.arrival.port'],
    extractionHint: 'Port of arrival.',
  },
  {
    logicalName: 'Arrival Time',
    appearsOnForms: ['arrival'],
    dataType: 'datetime',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.arrival.time'],
    extractionHint: 'Time of arrival at port.',
  },
  {
    logicalName: 'Pilot On Board Time',
    appearsOnForms: ['arrival'],
    dataType: 'datetime',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['voyageReporting.arrival.pilotOnBoard'],
    extractionHint: 'Time pilot boarded the vessel.',
  },
  // Departure-specific fields
  {
    logicalName: 'Departure Port',
    appearsOnForms: ['departure'],
    dataType: 'text',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.departure.port'],
    extractionHint: 'Port of departure.',
  },
  {
    logicalName: 'Departure Time',
    appearsOnForms: ['departure'],
    dataType: 'datetime',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.departure.time'],
    extractionHint: 'Time of departure from port.',
  },
  {
    logicalName: 'Pilot Off Time',
    appearsOnForms: ['departure'],
    dataType: 'datetime',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['voyageReporting.departure.pilotOff'],
    extractionHint: 'Time pilot disembarked from vessel.',
  },
  // Bunkering-specific fields
  {
    logicalName: 'Bunker Supplier',
    appearsOnForms: ['bunkering'],
    dataType: 'text',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['bunkering.supplier'],
    extractionHint: 'Name of bunker supplier.',
  },
  {
    logicalName: 'Bunker Grade',
    appearsOnForms: ['bunkering'],
    dataType: 'enum',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['bunkering.grade'],
    extractionHint: 'Grade of fuel bunkered.',
    validationRules: [{
      id: 'vr-bunker-grade-enum',
      kind: 'enum',
      config: { values: ['IFO 380', 'IFO 180', 'MGO', 'LSFO', 'VLSFO', 'ULSFO'] },
      severity: 'warn'
    }]
  },
  {
    logicalName: 'Quantity Bunkered',
    appearsOnForms: ['bunkering'],
    dataType: 'number',
    unit: 'MT',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['bunkering.quantity'],
    extractionHint: 'Quantity of fuel bunkered in metric tons.',
  },
  {
    logicalName: 'BDN Number',
    appearsOnForms: ['bunkering'],
    dataType: 'text',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['bunkering.bdnNumber'],
    extractionHint: 'Bunker Delivery Note number.',
  },
  // Cargo Handling fields
  {
    logicalName: 'Cargo Operation',
    appearsOnForms: ['cargo-handling'],
    dataType: 'enum',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['cargo.operation'],
    extractionHint: 'Type of cargo operation.',
    validationRules: [{
      id: 'vr-cargo-op-enum',
      kind: 'enum',
      config: { values: ['Loading', 'Discharging', 'Shifting', 'STS Transfer'] },
      severity: 'block'
    }]
  },
  {
    logicalName: 'Cargo Quantity',
    appearsOnForms: ['cargo-handling'],
    dataType: 'number',
    unit: 'MT',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['cargo.quantity'],
    extractionHint: 'Quantity of cargo loaded/discharged in metric tons.',
  },
  {
    logicalName: 'Cargo Grade',
    appearsOnForms: ['cargo-handling'],
    dataType: 'text',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['cargo.grade'],
    extractionHint: 'Grade/type of cargo.',
  },
  {
    logicalName: 'Loading Rate',
    appearsOnForms: ['cargo-handling'],
    dataType: 'number',
    unit: 'MT/hr',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['cargo.loadingRate'],
    extractionHint: 'Average loading/discharging rate in MT per hour.',
  },
  // SOF-specific fields
  {
    logicalName: 'NOR Tendered',
    appearsOnForms: ['sof'],
    dataType: 'datetime',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['sof.norTendered'],
    extractionHint: 'Time Notice of Readiness was tendered.',
  },
  {
    logicalName: 'NOR Accepted',
    appearsOnForms: ['sof'],
    dataType: 'datetime',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['sof.norAccepted'],
    extractionHint: 'Time Notice of Readiness was accepted.',
  },
  {
    logicalName: 'All Fast',
    appearsOnForms: ['sof'],
    dataType: 'datetime',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['sof.allFast'],
    extractionHint: 'Time vessel was all fast at berth.',
  },
  {
    logicalName: 'Hoses Connected',
    appearsOnForms: ['sof'],
    dataType: 'datetime',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['sof.hosesConnected'],
    extractionHint: 'Time cargo hoses were connected.',
  },
  {
    logicalName: 'Commenced Loading',
    appearsOnForms: ['sof'],
    dataType: 'datetime',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['sof.commencedLoading'],
    extractionHint: 'Time cargo loading commenced.',
  },
  {
    logicalName: 'Completed Loading',
    appearsOnForms: ['sof'],
    dataType: 'datetime',
    isCritical: true,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['sof.completedLoading'],
    extractionHint: 'Time cargo loading completed.',
  },
  {
    logicalName: 'Hoses Disconnected',
    appearsOnForms: ['sof'],
    dataType: 'datetime',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['sof.hosesDisconnected'],
    extractionHint: 'Time cargo hoses were disconnected.',
  },
  {
    logicalName: 'Documents On Board',
    appearsOnForms: ['sof'],
    dataType: 'datetime',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['sof.documentsOnBoard'],
    extractionHint: 'Time all cargo documents were received on board.',
  },
  // Master's signature field
  {
    logicalName: "Master's Name",
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure', 'bunkering', 'cargo-handling', 'sof'],
    dataType: 'text',
    isCritical: false,
    isMandatory: true,
    isCalculated: false,
    navtorPaths: ['voyageReporting.general.master'],
    extractionHint: "Master's full name for report signature.",
  },
  {
    logicalName: 'Remarks',
    appearsOnForms: ['noon-sea', 'noon-port', 'arrival', 'departure', 'bunkering', 'cargo-handling', 'sof'],
    dataType: 'text',
    isCritical: false,
    isMandatory: false,
    isCalculated: false,
    navtorPaths: ['voyageReporting.general.remarks'],
    extractionHint: 'General remarks and notes.',
  },
]

// Generate field definitions with proper IDs and versions
let fieldDefIdCounter = 1
export const fieldDefinitions: FieldDefinition[] = fieldDefinitionData.map((fd) => ({
  id: `fd-${String(fieldDefIdCounter++).padStart(4, '0')}`,
  targetSystemId: 'veslink',
  logicalName: fd.logicalName,
  name: fd.logicalName,
  appearsOnFormIds: fd.appearsOnForms,
  navtorSourcePaths: fd.navtorPaths,
  dataType: fd.dataType,
  unit: fd.unit,
  isCritical: fd.isCritical,
  isMandatory: fd.isMandatory,
  isCalculated: fd.isCalculated,
  formula: fd.formula,
  extractionHint: fd.extractionHint,
  validationRules: fd.validationRules || [],
  version: Math.floor(Math.random() * 8) + 1, // v1-v8
  updatedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(), // Last 90 days
  updatedBy: 'admin@seaways.com',
}))

// ----------------------------------------------------------------------------
// Flags (~200 flags spread across fields, some with 20+ flags)
// ----------------------------------------------------------------------------

const flagReasons: Flag['reason'][] = ['incorrect_value', 'wrong_source', 'missing', 'other']
const flagComments = [
  'Value does not match paper log',
  'Different from NAVTOR screenshot',
  'Source report had different value',
  'Calculation appears incorrect',
  'Unit conversion error',
  'Wrong date format',
  'Missing from source',
  undefined,
  undefined, // Some flags have no comment
  undefined,
]

// Weight certain fields to have more flags (20+)
const highFlagFields = fieldDefinitions.filter(fd => 
  ['IFO ROB', 'MGO ROB', 'Reported Speed', 'Distance to Go', 'IFO Total Consumption'].includes(fd.logicalName)
)
const mediumFlagFields = fieldDefinitions.filter(fd =>
  ['Beaufort', 'Time Since Last Report', 'Fresh Water ROB', 'Main Engine RPM'].includes(fd.logicalName)
)
const lowFlagFields = fieldDefinitions.filter(fd => 
  !highFlagFields.includes(fd) && !mediumFlagFields.includes(fd)
)

export const flags: Flag[] = []
let flagIdCounter = 1

// Generate 20-30 flags for high-flag fields
highFlagFields.forEach(fd => {
  const flagCount = 20 + Math.floor(Math.random() * 11) // 20-30
  for (let i = 0; i < flagCount; i++) {
    const vessel = vessels[Math.floor(Math.random() * vessels.length)]
    const crewUser = crewUsers.find(cu => cu.vesselId === vessel.id) || crewUsers[0]
    flags.push({
      id: `flag-${String(flagIdCounter++).padStart(5, '0')}`,
      fieldDefinitionId: fd.id,
      reportId: `report-${String(Math.floor(Math.random() * 1000) + 4000).padStart(5, '0')}`,
      vesselId: vessel.id,
      crewUserId: crewUser.id,
      flaggedValue: String(Math.random() * 100).slice(0, 5),
      sourceValue: String(Math.random() * 100).slice(0, 5),
      reason: flagReasons[Math.floor(Math.random() * flagReasons.length)],
      comment: flagComments[Math.floor(Math.random() * flagComments.length)],
      flaggedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.3 ? 'open' : 'fixed',
      reportStatus: Math.random() > 0.2 ? 'submitted' : 'draft',
    })
  }
})

// Generate 5-15 flags for medium-flag fields
mediumFlagFields.forEach(fd => {
  const flagCount = 5 + Math.floor(Math.random() * 11) // 5-15
  for (let i = 0; i < flagCount; i++) {
    const vessel = vessels[Math.floor(Math.random() * vessels.length)]
    const crewUser = crewUsers.find(cu => cu.vesselId === vessel.id) || crewUsers[0]
    flags.push({
      id: `flag-${String(flagIdCounter++).padStart(5, '0')}`,
      fieldDefinitionId: fd.id,
      reportId: `report-${String(Math.floor(Math.random() * 1000) + 4000).padStart(5, '0')}`,
      vesselId: vessel.id,
      crewUserId: crewUser.id,
      flaggedValue: String(Math.random() * 100).slice(0, 5),
      sourceValue: String(Math.random() * 100).slice(0, 5),
      reason: flagReasons[Math.floor(Math.random() * flagReasons.length)],
      comment: flagComments[Math.floor(Math.random() * flagComments.length)],
      flaggedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.4 ? 'open' : 'fixed',
      reportStatus: Math.random() > 0.2 ? 'submitted' : 'draft',
    })
  }
})

// Generate 0-3 flags for low-flag fields
lowFlagFields.forEach(fd => {
  const flagCount = Math.floor(Math.random() * 4) // 0-3
  for (let i = 0; i < flagCount; i++) {
    const vessel = vessels[Math.floor(Math.random() * vessels.length)]
    const crewUser = crewUsers.find(cu => cu.vesselId === vessel.id) || crewUsers[0]
    flags.push({
      id: `flag-${String(flagIdCounter++).padStart(5, '0')}`,
      fieldDefinitionId: fd.id,
      reportId: `report-${String(Math.floor(Math.random() * 1000) + 4000).padStart(5, '0')}`,
      vesselId: vessel.id,
      crewUserId: crewUser.id,
      flaggedValue: String(Math.random() * 100).slice(0, 5),
      sourceValue: String(Math.random() * 100).slice(0, 5),
      reason: flagReasons[Math.floor(Math.random() * flagReasons.length)],
      comment: flagComments[Math.floor(Math.random() * flagComments.length)],
      flaggedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.5 ? 'open' : 'fixed',
      reportStatus: Math.random() > 0.2 ? 'submitted' : 'draft',
    })
  }
})

// ----------------------------------------------------------------------------
// Submissions (~500 across fleet, last 60 days, varying adoption)
// ----------------------------------------------------------------------------

export const submissions: Submission[] = []
let submissionIdCounter = 1

// Create adoption distribution: some vessels at 95%, some at 0%, skewed distribution
const vesselAdoption: Record<string, number> = {}
vessels.forEach((vessel, index) => {
  if (index < 10) {
    vesselAdoption[vessel.id] = 0.95 // Top performers
  } else if (index < 25) {
    vesselAdoption[vessel.id] = 0.8 + Math.random() * 0.15 // High adopters
  } else if (index < 50) {
    vesselAdoption[vessel.id] = 0.5 + Math.random() * 0.3 // Medium adopters
  } else if (index < 70) {
    vesselAdoption[vessel.id] = 0.2 + Math.random() * 0.3 // Low adopters
  } else if (index < 78) {
    vesselAdoption[vessel.id] = 0.05 + Math.random() * 0.15 // Very low
  } else {
    vesselAdoption[vessel.id] = 0 // Zero adoption
  }
})

// Generate ~500 submissions over 60 days
for (let day = 0; day < 60; day++) {
  vessels.forEach(vessel => {
    const adoption = vesselAdoption[vessel.id]
    // Each vessel could have 0-2 reports per day based on adoption
    const reportsToday = Math.random() < adoption ? (Math.random() < 0.3 ? 2 : 1) : 0
    
    for (let r = 0; r < reportsToday; r++) {
      const formId = targetForms[Math.floor(Math.random() * 4)].id // Mostly noon-sea, noon-port, arrival, departure
      const criticalTotal = formId.includes('noon') ? 16 : formId === 'arrival' || formId === 'departure' ? 8 : 6
      const criticalVerified = Math.floor(criticalTotal * (0.85 + Math.random() * 0.15))
      const crewUser = crewUsers.find(cu => cu.vesselId === vessel.id) || crewUsers[0]
      
      submissions.push({
        id: `sub-${String(submissionIdCounter++).padStart(5, '0')}`,
        vesselId: vessel.id,
        formId,
        submittedAt: new Date(Date.now() - day * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
        submittedBy: crewUser.email,
        criticalVerifiedCount: criticalVerified,
        criticalTotalCount: criticalTotal,
        fieldsVerified: criticalVerified + Math.floor(Math.random() * 15),
        fieldsFlagged: Math.random() < 0.15 ? Math.floor(Math.random() * 3) + 1 : 0,
      })
    }
  })
}

// Sort submissions by date, newest first
submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

// ----------------------------------------------------------------------------
// Test Runs (sample test run history for various fields)
// ----------------------------------------------------------------------------

export const testRuns: TestRun[] = []
let testRunIdCounter = 1

// Generate test runs for a subset of field definitions
fieldDefinitions.slice(0, 20).forEach(fd => {
  const runCount = Math.floor(Math.random() * 5) + 1 // 1-5 test runs per field
  for (let i = 0; i < runCount; i++) {
    const correctCount = Math.floor(Math.random() * 4) + 7 // 7-10 correct
    testRuns.push({
      id: `tr-${String(testRunIdCounter++).padStart(5, '0')}`,
      fieldDefinitionId: fd.id,
      reportId: `report-${String(Math.floor(Math.random() * 500) + 4000).padStart(5, '0')}`,
      expectedValue: String(Math.random() * 100).slice(0, 5),
      runs: Array(10).fill(0).map(() => Math.random() < (correctCount / 10) ? 1 : 0),
      correctCount,
      totalRuns: 10,
      definitionVersion: fd.version - Math.floor(Math.random() * 3),
      ranAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }
})

// ----------------------------------------------------------------------------
// Definition Changes (version history for fields)
// ----------------------------------------------------------------------------

export const definitionChanges: DefinitionChange[] = []
let changeIdCounter = 1

const changeSummaries = [
  'Updated extraction hint for clarity',
  'Changed validation rule range from 0-20 to 0-25',
  'Added new NAVTOR source path',
  'Modified formula calculation',
  'Added enum validation values',
  'Changed severity from warn to block',
  'Updated unit from nm to nautical miles',
  'Fixed typo in field description',
  'Added cross-field validation rule',
  'Removed deprecated source path',
]

fieldDefinitions.forEach(fd => {
  if (fd.version > 1) {
    for (let v = 1; v < fd.version; v++) {
      definitionChanges.push({
        id: `dc-${String(changeIdCounter++).padStart(5, '0')}`,
        fieldDefinitionId: fd.id,
        fromVersion: v,
        toVersion: v + 1,
        changedBy: Math.random() > 0.5 ? 'admin@seaways.com' : 'ops.manager@seaways.com',
        changedAt: new Date(Date.now() - (fd.version - v) * 7 * 24 * 60 * 60 * 1000 - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        diffSummary: changeSummaries[Math.floor(Math.random() * changeSummaries.length)],
      })
    }
  }
})

// Sort changes by date, newest first
definitionChanges.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

export function getVesselById(id: string): Vessel | undefined {
  return vessels.find(v => v.id === id)
}

export function getVesselByName(name: string): Vessel | undefined {
  return vessels.find(v => v.name.toLowerCase().includes(name.toLowerCase()))
}

export function getCrewUserById(id: string): CrewUser | undefined {
  return crewUsers.find(cu => cu.id === id)
}

export function getCrewUsersForVessel(vesselId: string): CrewUser[] {
  return crewUsers.filter(cu => cu.vesselId === vesselId)
}

export function getFieldDefinitionById(id: string): FieldDefinition | undefined {
  return fieldDefinitions.find(fd => fd.id === id)
}

export function getFieldDefinitionsByForm(formId: string): FieldDefinition[] {
  return fieldDefinitions.filter(fd => fd.appearsOnFormIds.includes(formId))
}

export function getFlagsForField(fieldDefinitionId: string): Flag[] {
  return flags.filter(f => f.fieldDefinitionId === fieldDefinitionId)
}

export function getOpenFlagsForField(fieldDefinitionId: string): Flag[] {
  return flags.filter(f => f.fieldDefinitionId === fieldDefinitionId && f.status === 'open')
}

export function getSubmissionsForVessel(vesselId: string): Submission[] {
  return submissions.filter(s => s.vesselId === vesselId)
}

export function getSubmissionsInDateRange(startDate: Date, endDate: Date): Submission[] {
  return submissions.filter(s => {
    const submittedAt = new Date(s.submittedAt)
    return submittedAt >= startDate && submittedAt <= endDate
  })
}

export function getTestRunsForField(fieldDefinitionId: string): TestRun[] {
  return testRuns.filter(tr => tr.fieldDefinitionId === fieldDefinitionId)
}

export function getDefinitionChangesForField(fieldDefinitionId: string): DefinitionChange[] {
  return definitionChanges.filter(dc => dc.fieldDefinitionId === fieldDefinitionId)
}

export function getVesselAdoptionRate(vesselId: string): number {
  return vesselAdoption[vesselId] ?? 0
}

export function getAllVesselAdoptionRates(): Record<string, number> {
  return { ...vesselAdoption }
}

// ----------------------------------------------------------------------------
// Computed Stats
// ----------------------------------------------------------------------------

export function getOpenFlagCount(): number {
  return flags.filter(f => f.status === 'open').length
}

export function getSubmissionsLast30Days(): number {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return submissions.filter(s => new Date(s.submittedAt) >= thirtyDaysAgo).length
}

export function getDefinitionChangesLast7Days(): number {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return definitionChanges.filter(dc => new Date(dc.changedAt) >= sevenDaysAgo).length
}

export function getAverageConfidenceLast30Days(): number {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentSubmissions = submissions.filter(s => new Date(s.submittedAt) >= thirtyDaysAgo)
  if (recentSubmissions.length === 0) return 0
  
  const totalConfidence = recentSubmissions.reduce((sum, s) => {
    return sum + (s.criticalVerifiedCount / s.criticalTotalCount) * 100
  }, 0)
  
  return Math.round(totalConfidence / recentSubmissions.length)
}

export function getTopFlaggedFields(limit: number = 10): Array<{ fieldDefinition: FieldDefinition; flagCount: number }> {
  const flagCounts = new Map<string, number>()
  
  flags.filter(f => f.status === 'open').forEach(f => {
    flagCounts.set(f.fieldDefinitionId, (flagCounts.get(f.fieldDefinitionId) || 0) + 1)
  })
  
  return Array.from(flagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([fieldId, count]) => ({
      fieldDefinition: fieldDefinitions.find(fd => fd.id === fieldId)!,
      flagCount: count,
    }))
    .filter(item => item.fieldDefinition)
}

export function getVesselsByAdoption(): Array<{ vessel: Vessel; adoptionRate: number; submissionCount: number; lastActivity: string | null }> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  return vessels.map(vessel => {
    const vesselSubmissions = submissions.filter(
      s => s.vesselId === vessel.id && new Date(s.submittedAt) >= thirtyDaysAgo
    )
    const lastSubmission = vesselSubmissions[0]
    
    return {
      vessel,
      adoptionRate: vesselAdoption[vessel.id] || 0,
      submissionCount: vesselSubmissions.length,
      lastActivity: lastSubmission?.submittedAt || null,
    }
  }).sort((a, b) => b.adoptionRate - a.adoptionRate)
}

export interface VerificationAccuracyByForm {
  formId: string
  formName: string
  verified: number        // crew confirmed correct
  autoAccepted: number   // no flag, submitted as-prefilled
  flagged: number        // crew marked incorrect
  total: number          // total field events
  verifiedPct: number
  autoAcceptedPct: number
  flaggedPct: number
}

export function getVerificationAccuracyByForm(): VerificationAccuracyByForm[] {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentSubmissions = submissions.filter(s => new Date(s.submittedAt) >= thirtyDaysAgo)
  
  return targetForms.map(form => {
    const formSubmissions = recentSubmissions.filter(s => s.formId === form.id)
    
    // Calculate totals from submission data
    let totalVerified = 0
    let totalFlagged = 0
    let totalFields = 0
    
    formSubmissions.forEach(s => {
      totalVerified += s.fieldsVerified
      totalFlagged += s.fieldsFlagged
      // Estimate total fields per submission (verified + flagged + auto-accepted)
      totalFields += s.fieldsVerified + s.fieldsFlagged
    })
    
    // Auto-accepted = total verified but not explicitly flagged (estimate as ~60% of verified)
    const autoAccepted = Math.round(totalVerified * 0.6)
    const verified = totalVerified - autoAccepted
    const flagged = totalFlagged
    const total = verified + autoAccepted + flagged
    
    // Calculate percentages
    const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0
    const autoAcceptedPct = total > 0 ? Math.round((autoAccepted / total) * 100) : 0
    const flaggedPct = total > 0 ? Math.round((flagged / total) * 100) : 0
    
    return {
      formId: form.id,
      formName: form.name,
      verified,
      autoAccepted,
      flagged,
      total,
      verifiedPct,
      autoAcceptedPct,
      flaggedPct,
    }
  })
}

export interface MostFlaggedField {
  fieldId: string
  fieldName: string
  formNames: string[]
  flagCount: number
}

export function getMostFlaggedFields(limit: number = 10): MostFlaggedField[] {
  // Get flag counts from the flags array, grouped by field
  const fieldFlagCounts = new Map<string, { fieldName: string; formIds: Set<string>; count: number }>()
  
  flags.forEach(flag => {
    const field = fieldDefinitions.find(f => f.id === flag.fieldId)
    if (!field) return
    
    const existing = fieldFlagCounts.get(flag.fieldId)
    if (existing) {
      existing.count++
      existing.formIds.add(flag.formId)
    } else {
      fieldFlagCounts.set(flag.fieldId, {
        fieldName: field.name,
        formIds: new Set([flag.formId]),
        count: 1,
      })
    }
  })
  
  // Convert to array and sort by flag count descending
  const sorted = Array.from(fieldFlagCounts.entries())
    .map(([fieldId, data]) => ({
      fieldId,
      fieldName: data.fieldName,
      formNames: Array.from(data.formIds).map(formId => {
        const form = targetForms.find(f => f.id === formId)
        return form?.name || formId
      }),
      flagCount: data.count,
    }))
    .sort((a, b) => b.flagCount - a.flagCount)
    .slice(0, limit)
  
  return sorted
}
