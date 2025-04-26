import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, AlertTriangle } from "lucide-react";
import FormOcr from "@/components/FormOcr";
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
interface FHIRFormProps {
  onSave: (data: any) => void;
}

export function FHIRForm({ onSave }: FHIRFormProps) {
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

  // Update the FHIR output based on selected tab
  const updateFHIROutput = () => {
    try {
      let outputData;
      
      if (activeTab === "patient") {
        outputData = patientData;
      } else if (activeTab === "observation") {
        outputData = observationData;
      } else if (activeTab === "medication") {
        outputData = medicationData;
      } else if (activeTab === "raw") {
        try {
          outputData = JSON.parse(rawJsonInput);
          setJsonError("");
        } catch (error) {
          setJsonError("Invalid JSON format");
          return;
        }
      }
      
      setFhirOutput(JSON.stringify(outputData, null, 2));
    } catch (error) {
      console.error("Error updating FHIR output:", error);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    try {
      let dataToSave;
      
      if (activeTab === "patient") {
        dataToSave = patientData;
      } else if (activeTab === "observation") {
        dataToSave = observationData;
      } else if (activeTab === "medication") {
        dataToSave = medicationData;
      } else if (activeTab === "raw") {
        try {
          dataToSave = JSON.parse(rawJsonInput);
        } catch (error) {
          console.error("Invalid JSON:", error);
          return;
        }
      } else {
        console.error("Unknown active tab:", activeTab);
        return;
      }
      
      onSave(dataToSave);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Handle raw JSON input change
  const handleRawJsonChange = (value: string) => {
    setRawJsonInput(value);
    try {
      JSON.parse(value);
      setJsonError("");
    } catch (error) {
      setJsonError("Invalid JSON format");
    }
    updateFHIROutput();
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Tabs defaultValue="patient" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="patient">Patient</TabsTrigger>
          <TabsTrigger value="observation">Lab Test</TabsTrigger>
          <TabsTrigger value="medication">Medication</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>
        
        {/* Patient Form */}
        <TabsContent value="patient" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="givenName">First Name</Label>
              <Input 
                id="givenName" 
                value={patientData.name[0].given[0]} 
                onChange={(e) => handlePatientChange("givenName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="familyName">Last Name</Label>
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
            <Label htmlFor="addressLine">Address</Label>
            <Input 
              id="addressLine" 
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
        
        {/* Observation Form (Lab Test) */}
        <TabsContent value="observation" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testType">Test Type</Label>
            <Select 
              value={observationData.code.coding[0].code} 
              onValueChange={(value) => handleObservationChange("code", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select test type" />
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
              <Label htmlFor="testValue">Value</Label>
              <Input 
                id="testValue" 
                type="number" 
                step="0.1" 
                value={observationData.valueQuantity.value.toString()} 
                onChange={(e) => handleObservationChange("value", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testUnit">Unit</Label>
              <Input 
                id="testUnit" 
                value={selectedTestCode.unit} 
                disabled
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="testDate">Date</Label>
            <Input 
              id="testDate" 
              type="date" 
              value={observationData.effectiveDateTime} 
              onChange={(e) => handleObservationChange("effectiveDateTime", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="patientRef">Patient Reference ID (optional)</Label>
            <Input 
              id="patientRef" 
              placeholder="Leave blank to use your own patient ID" 
              onChange={(e) => handleObservationChange("patientId", e.target.value)}
            />
          </div>
        </TabsContent>
        
        {/* Medication Form */}
        <TabsContent value="medication" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicationName">Medication</Label>
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
            <Label htmlFor="dosageText">Dosage Instructions</Label>
            <Textarea 
              id="dosageText" 
              placeholder="E.g., Take one tablet by mouth daily" 
              value={medicationData.dosage[0].text} 
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
                value={medicationData.dosage[0].timing.repeat.frequency.toString()} 
                onChange={(e) => handleMedicationChange("frequency", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Input 
                id="period" 
                type="number" 
                min="1" 
                value={medicationData.dosage[0].timing.repeat.period.toString()} 
                onChange={(e) => handleMedicationChange("period", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodUnit">Period Unit</Label>
              <Select 
                value={medicationData.dosage[0].timing.repeat.periodUnit} 
                onValueChange={(value) => handleMedicationChange("periodUnit", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="d">Day</SelectItem>
                  <SelectItem value="h">Hour</SelectItem>
                  <SelectItem value="min">Minute</SelectItem>
                  <SelectItem value="wk">Week</SelectItem>
                  <SelectItem value="mo">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="medicationDate">Start Date</Label>
            <Input 
              id="medicationDate" 
              type="date" 
              value={medicationData.effectiveDateTime} 
              onChange={(e) => handleMedicationChange("effectiveDateTime", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="medPatientRef">Patient Reference ID (optional)</Label>
            <Input 
              id="medPatientRef" 
              placeholder="Leave blank to use your own patient ID" 
              onChange={(e) => handleMedicationChange("patientId", e.target.value)}
            />
          </div>
        </TabsContent>
        
        {/* Raw JSON Form */}
        <TabsContent value="raw" className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="rawJson">Raw FHIR Resource (JSON)</Label>
              {jsonError && (
                <div className="text-red-500 text-sm flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {jsonError}
                </div>
              )}
            </div>
            <Textarea 
              id="rawJson" 
              className="font-mono min-h-[300px]" 
              placeholder="Paste your FHIR JSON here" 
              value={rawJsonInput} 
              onChange={(e) => handleRawJsonChange(e.target.value)}
            />
          </div>
          <FormOcr />
        </TabsContent>
      </Tabs>
      
      {/* Preview */}
      <div className="border rounded-md p-4">
        <h3 className="text-sm font-medium mb-2">FHIR Resource Preview</h3>
        <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs h-40 font-mono">
          {fhirOutput}
        </pre>
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          className="bg-[#22c55e] hover:bg-[#22c55e]/90 gap-2"
        >
          <Zap className="h-4 w-4" />
          Save Health Record
        </Button>
      </div>
    </div>
  );
} 