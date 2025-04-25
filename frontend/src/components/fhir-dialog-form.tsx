import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, AlertTriangle } from "lucide-react";

// Define the basic FHIR Patient template
const FHIR_PATIENT_TEMPLATE = {
  resourceType: "Patient",
  active: true,
  name: [
    {
      use: "official",
      family: "",
      given: [""]
    }
  ],
  gender: "",
  birthDate: "",
  address: [
    {
      use: "home",
      line: [""],
      city: "",
      state: "",
      postalCode: ""
    }
  ],
  telecom: [
    {
      system: "phone",
      value: "",
      use: "mobile"
    },
    {
      system: "email",
      value: "",
      use: "home"
    }
  ],
  extension: []
};

// Define the FHIR Observation template
const FHIR_OBSERVATION_TEMPLATE = {
  resourceType: "Observation",
  status: "final",
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "",
        display: ""
      }
    ],
    text: ""
  },
  subject: {
    reference: "Patient/"
  },
  effectiveDateTime: "",
  valueQuantity: {
    value: "",
    unit: "",
    system: "http://unitsofmeasure.org",
    code: ""
  }
};

// Define the FHIR MedicationStatement template
const FHIR_MEDICATION_TEMPLATE = {
  resourceType: "MedicationStatement",
  status: "active",
  medicationCodeableConcept: {
    coding: [
      {
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        code: "",
        display: ""
      }
    ],
    text: ""
  },
  subject: {
    reference: "Patient/"
  },
  effectiveDateTime: "",
  dosage: [
    {
      text: "",
      timing: {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: "d"
        }
      },
      route: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "26643006",
            display: "Oral route"
          }
        ]
      }
    }
  ]
};

// The common blood test LOINC codes
const COMMON_LOINC_CODES = [
  { code: "2093-3", display: "Cholesterol", unit: "mg/dL" },
  { code: "2085-9", display: "HDL Cholesterol", unit: "mg/dL" },
  { code: "2089-1", display: "LDL Cholesterol", unit: "mg/dL" },
  { code: "6690-2", display: "White Blood Cell Count", unit: "10*3/uL" },
  { code: "789-8", display: "Red Blood Cell Count", unit: "10*6/uL" },
  { code: "718-7", display: "Hemoglobin", unit: "g/dL" },
  { code: "4548-4", display: "Hemoglobin A1c", unit: "%" },
  { code: "2339-0", display: "Glucose", unit: "mg/dL" },
  { code: "2160-0", display: "Creatinine", unit: "mg/dL" },
  { code: "3094-0", display: "Blood Urea Nitrogen", unit: "mg/dL" },
];

// Common medication codes
const COMMON_MEDICATION_CODES = [
  { code: "314076", display: "Lisinopril 10 MG Oral Tablet" },
  { code: "197361", display: "Amlodipine 5 MG Oral Tablet" },
  { code: "207106", display: "Metformin 500 MG Oral Tablet" },
  { code: "310798", display: "Ibuprofen 200 MG Oral Tablet" },
  { code: "198440", display: "Atorvastatin 20 MG Oral Tablet" },
  { code: "310965", display: "Levothyroxine 50 UG Oral Tablet" },
  { code: "849727", display: "Metoprolol Tartrate 25 MG Oral Tablet" },
  { code: "1100072", display: "Omeprazole 20 MG Oral Capsule" },
  { code: "2295254", display: "Simvastatin 20 MG Oral Tablet" },
  { code: "209459", display: "Acetaminophen 325 MG Oral Tablet" },
];

// Interface for props
interface FHIRDialogFormProps {
  onSave: (data: any) => void;
  buttonText?: string;
  buttonClassName?: string;
}

export function FHIRDialogForm({ 
  onSave, 
  buttonText = "Add record",
  buttonClassName = "gap-2 bg-[#1a81cd] hover:bg-[#1a81cd]/90" 
}: FHIRDialogFormProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("patient");
  const [patientData, setPatientData] = useState({ ...FHIR_PATIENT_TEMPLATE });
  const [observationData, setObservationData] = useState({ ...FHIR_OBSERVATION_TEMPLATE });
  const [medicationData, setMedicationData] = useState({ ...FHIR_MEDICATION_TEMPLATE });
  const [selectedTestCode, setSelectedTestCode] = useState(COMMON_LOINC_CODES[0]);
  const [selectedMedicationCode, setSelectedMedicationCode] = useState(COMMON_MEDICATION_CODES[0]);
  const [fhirOutput, setFhirOutput] = useState("");
  const [rawJsonInput, setRawJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");

  // Handle patient data changes
  const handlePatientChange = (field: string, value: string) => {
    const newPatientData = { ...patientData };
    
    if (field === "familyName") {
      newPatientData.name[0].family = value;
    } else if (field === "givenName") {
      newPatientData.name[0].given[0] = value;
    } else if (field === "gender") {
      newPatientData.gender = value;
    } else if (field === "birthDate") {
      newPatientData.birthDate = value;
    } else if (field === "line") {
      newPatientData.address[0].line[0] = value;
    } else if (field === "city") {
      newPatientData.address[0].city = value;
    } else if (field === "state") {
      newPatientData.address[0].state = value;
    } else if (field === "postalCode") {
      newPatientData.address[0].postalCode = value;
    } else if (field === "phone") {
      newPatientData.telecom[0].value = value;
    } else if (field === "email") {
      newPatientData.telecom[1].value = value;
    }
    
    setPatientData(newPatientData);
    updateFHIROutput();
  };

  // Handle observation data changes
  const handleObservationChange = (field: string, value: string) => {
    const newObservationData = { ...observationData };
    
    if (field === "code") {
      const selectedCode = COMMON_LOINC_CODES.find(c => c.code === value) || COMMON_LOINC_CODES[0];
      setSelectedTestCode(selectedCode);
      
      newObservationData.code.coding[0].code = selectedCode.code;
      newObservationData.code.coding[0].display = selectedCode.display;
      newObservationData.code.text = selectedCode.display;
      newObservationData.valueQuantity.unit = selectedCode.unit;
      newObservationData.valueQuantity.code = selectedCode.unit;
    } else if (field === "effectiveDateTime") {
      newObservationData.effectiveDateTime = value;
    } else if (field === "value") {
      newObservationData.valueQuantity.value = value;
    } else if (field === "patientId") {
      newObservationData.subject.reference = `Patient/${value}`;
    }
    
    setObservationData(newObservationData);
    updateFHIROutput();
  };

  // Handle medication data changes
  const handleMedicationChange = (field: string, value: string) => {
    const newMedicationData = { ...medicationData };
    
    if (field === "code") {
      const selectedMed = COMMON_MEDICATION_CODES.find(m => m.code === value) || COMMON_MEDICATION_CODES[0];
      setSelectedMedicationCode(selectedMed);
      
      newMedicationData.medicationCodeableConcept.coding[0].code = selectedMed.code;
      newMedicationData.medicationCodeableConcept.coding[0].display = selectedMed.display;
      newMedicationData.medicationCodeableConcept.text = selectedMed.display;
    } else if (field === "effectiveDateTime") {
      newMedicationData.effectiveDateTime = value;
    } else if (field === "dosage") {
      newMedicationData.dosage[0].text = value;
    } else if (field === "frequency") {
      newMedicationData.dosage[0].timing.repeat.frequency = parseInt(value, 10) || 1;
    } else if (field === "period") {
      newMedicationData.dosage[0].timing.repeat.period = parseInt(value, 10) || 1;
    } else if (field === "periodUnit") {
      newMedicationData.dosage[0].timing.repeat.periodUnit = value;
    } else if (field === "patientId") {
      newMedicationData.subject.reference = `Patient/${value}`;
    }
    
    setMedicationData(newMedicationData);
    updateFHIROutput();
  };

  // Update the FHIR output JSON
  const updateFHIROutput = () => {
    let output = {};
    
    if (activeTab === "patient") {
      output = patientData;
    } else if (activeTab === "observation") {
      output = observationData;
    } else if (activeTab === "medication") {
      output = medicationData;
    } else if (activeTab === "bundle") {
      // Create a FHIR Bundle with all resources
      output = {
        resourceType: "Bundle",
        type: "collection",
        entry: [
          { resource: patientData },
          { resource: observationData },
          { resource: medicationData }
        ]
      };
    } else if (activeTab === "rawjson") {
      try {
        if (rawJsonInput.trim()) {
          output = JSON.parse(rawJsonInput);
          setJsonError("");
        } else {
          output = {};
        }
      } catch (error) {
        setJsonError("Invalid JSON format");
        output = {};
      }
    }
    
    setFhirOutput(JSON.stringify(output, null, 2));
  };

  // Handle form submission
  const handleSubmit = () => {
    let dataToSave;
    
    if (activeTab === "rawjson") {
      try {
        if (!rawJsonInput.trim()) {
          setJsonError("Please enter JSON data");
          return;
        }
        
        dataToSave = JSON.parse(rawJsonInput);
        
        // Basic validation - ensure it's FHIR compliant by checking for resourceType
        if (!dataToSave.resourceType) {
          setJsonError("Invalid FHIR format: Missing resourceType");
          return;
        }
        
        setJsonError("");
      } catch (error) {
        setJsonError("Invalid JSON format");
        return;
      }
    } else if (activeTab === "bundle") {
      // Create a FHIR Bundle with all resources
      dataToSave = {
        resourceType: "Bundle",
        type: "collection",
        entry: [
          { resource: patientData },
          { resource: observationData },
          { resource: medicationData }
        ]
      };
    } else if (activeTab === "patient") {
      dataToSave = patientData;
    } else if (activeTab === "observation") {
      dataToSave = observationData;
    } else if (activeTab === "medication") {
      dataToSave = medicationData;
    }
    
    onSave(dataToSave);
    setOpen(false);
  };

  // Handle raw JSON input change
  const handleRawJsonChange = (value: string) => {
    setRawJsonInput(value);
    try {
      if (value.trim()) {
        JSON.parse(value);
        setJsonError("");
      } else {
        setJsonError("");
      }
    } catch (error) {
      setJsonError("Invalid JSON format");
    }
    updateFHIROutput();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={buttonClassName}>
          {buttonText}
          <Zap className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Add FHIR Medical Record</DialogTitle>
          <DialogDescription>
            Create a new health record using the FHIR standard format. Fill out the form below and click save when done.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          updateFHIROutput();
        }}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="patient">Patient</TabsTrigger>
            <TabsTrigger value="observation">Observation</TabsTrigger>
            <TabsTrigger value="medication">Medication</TabsTrigger>
            <TabsTrigger value="bundle">Bundle</TabsTrigger>
            <TabsTrigger value="rawjson">Raw JSON</TabsTrigger>
          </TabsList>
          
          {/* Patient Information Tab */}
          <TabsContent value="patient" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="givenName">Given Name</Label>
                <Input 
                  id="givenName" 
                  value={patientData.name[0].given[0]}
                  onChange={(e) => handlePatientChange("givenName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="familyName">Family Name</Label>
                <Input 
                  id="familyName" 
                  value={patientData.name[0].family}
                  onChange={(e) => handlePatientChange("familyName", e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={patientData.gender}
                  onValueChange={(value) => handlePatientChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input 
                  id="birthDate" 
                  type="date" 
                  value={patientData.birthDate}
                  onChange={(e) => handlePatientChange("birthDate", e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="line">Address</Label>
              <Input 
                id="line" 
                value={patientData.address[0].line[0]}
                onChange={(e) => handlePatientChange("line", e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  value={patientData.address[0].city}
                  onChange={(e) => handlePatientChange("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  value={patientData.address[0].state}
                  onChange={(e) => handlePatientChange("state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input 
                  id="postalCode" 
                  value={patientData.address[0].postalCode}
                  onChange={(e) => handlePatientChange("postalCode", e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  value={patientData.telecom[0].value}
                  onChange={(e) => handlePatientChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={patientData.telecom[1].value}
                  onChange={(e) => handlePatientChange("email", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Observation Tab */}
          <TabsContent value="observation" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input 
                id="patientId" 
                placeholder="Enter patient ID"
                onChange={(e) => handleObservationChange("patientId", e.target.value)}
              />
              <p className="text-xs text-gray-500">The ID of the patient this observation belongs to</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observationType">Observation Type</Label>
              <Select 
                value={observationData.code.coding[0].code}
                onValueChange={(value) => handleObservationChange("code", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select observation type" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_LOINC_CODES.map((code) => (
                    <SelectItem key={code.code} value={code.code}>
                      {code.display} ({code.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="observationValue">Value</Label>
                <Input 
                  id="observationValue" 
                  type="number" 
                  placeholder={`Value in ${selectedTestCode.unit}`}
                  onChange={(e) => handleObservationChange("value", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observationDate">Date</Label>
                <Input 
                  id="observationDate" 
                  type="date" 
                  onChange={(e) => handleObservationChange("effectiveDateTime", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Medication Tab */}
          <TabsContent value="medication" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medicationPatientId">Patient ID</Label>
              <Input 
                id="medicationPatientId" 
                placeholder="Enter patient ID"
                onChange={(e) => handleMedicationChange("patientId", e.target.value)}
              />
              <p className="text-xs text-gray-500">The ID of the patient this medication belongs to</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="medicationType">Medication</Label>
              <Select 
                value={medicationData.medicationCodeableConcept.coding[0].code}
                onValueChange={(value) => handleMedicationChange("code", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select medication" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_MEDICATION_CODES.map((med) => (
                    <SelectItem key={med.code} value={med.code}>
                      {med.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="medicationDate">Start Date</Label>
              <Input 
                id="medicationDate" 
                type="date" 
                onChange={(e) => handleMedicationChange("effectiveDateTime", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dosageInstructions">Dosage Instructions</Label>
              <Textarea 
                id="dosageInstructions" 
                placeholder="E.g., Take 1 tablet by mouth once daily"
                onChange={(e) => handleMedicationChange("dosage", e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Input 
                  id="frequency" 
                  type="number" 
                  min="1"
                  defaultValue="1" 
                  onChange={(e) => handleMedicationChange("frequency", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Input 
                  id="period" 
                  type="number" 
                  min="1" 
                  defaultValue="1"
                  onChange={(e) => handleMedicationChange("period", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodUnit">Unit</Label>
                <Select 
                  defaultValue="d"
                  onValueChange={(value) => handleMedicationChange("periodUnit", value)}
                >
                  <SelectTrigger id="periodUnit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h">Hour</SelectItem>
                    <SelectItem value="d">Day</SelectItem>
                    <SelectItem value="wk">Week</SelectItem>
                    <SelectItem value="mo">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          {/* Bundle Tab */}
          <TabsContent value="bundle" className="space-y-4">
            <p className="text-sm text-gray-700">
              A Bundle combines multiple FHIR resources into one document. This tab will create a Bundle 
              containing the Patient, Observation, and Medication resources you've defined in the other tabs.
            </p>
            
            <div className="p-3 bg-gray-50 border rounded-md">
              <h3 className="font-medium mb-1">Bundle Preview</h3>
              <p className="text-xs text-gray-500 mb-2">
                This bundle will contain the following resources:
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Patient: {patientData.name[0].given[0]} {patientData.name[0].family}</li>
                <li>Observation: {observationData.code.coding[0].display}</li>
                <li>Medication: {medicationData.medicationCodeableConcept.coding[0].display}</li>
              </ul>
            </div>
          </TabsContent>
          
          {/* Raw JSON Tab */}
          <TabsContent value="rawjson" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rawJson">Raw FHIR JSON</Label>
              <Textarea 
                id="rawJson" 
                value={rawJsonInput}
                onChange={(e) => handleRawJsonChange(e.target.value)}
                placeholder="Paste your FHIR JSON here..."
                className="font-mono text-xs min-h-[300px]"
              />
              {jsonError && (
                <div className="text-red-500 text-sm flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  {jsonError}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Enter valid FHIR JSON data. Make sure it includes a 'resourceType' field.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="space-y-2 mt-4">
          <Label>FHIR Output</Label>
          <Textarea 
            value={fhirOutput}
            rows={6}
            readOnly
            className="font-mono text-xs"
          />
        </div>
        
        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">Cancel</Button>
          <Button onClick={handleSubmit} className="bg-[#1a81cd]">Save Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 