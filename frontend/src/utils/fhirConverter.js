/**
 * Converts OCR extracted data to FHIR Bundle format
 */

// Generate a random ID for resources
const generateId = () => {
  return Math.random().toString(36).substring(2, 10);
};

// Convert simple key-value data to FHIR Patient resource
const createPatientResource = (data) => {
  const patientId = `patient-${generateId()}`;

  const patient = {
    resourceType: "Patient",
    id: patientId,
    identifier: [],
    name: [],
    telecom: [],
    address: [],
  };

  // Add patient details if available
  if (data.name || data.firstName || data.lastName) {
    const given = [];
    if (data.firstName) given.push(data.firstName);
    if (data.givenName) given.push(data.givenName);

    patient.name.push({
      use: "official",
      family:
        data.lastName || data.familyName || data.name?.split(" ").pop() || "",
      given:
        given.length > 0 ? given : data.name?.split(" ").slice(0, -1) || [],
    });
  }

  if (data.gender) {
    patient.gender = data.gender.toLowerCase();
  }

  if (data.birthDate || data.dateOfBirth || data.dob) {
    patient.birthDate = data.birthDate || data.dateOfBirth || data.dob;
  }

  if (data.phone || data.phoneNumber || data.contactNumber) {
    patient.telecom.push({
      system: "phone",
      value: data.phone || data.phoneNumber || data.contactNumber,
      use: "home",
    });
  }

  if (data.email || data.emailAddress) {
    patient.telecom.push({
      system: "email",
      value: data.email || data.emailAddress,
    });
  }

  if (data.city || data.state || data.country || data.address) {
    patient.address.push({
      city: data.city || "",
      state: data.state || "",
      country: data.country || "",
      line: [data.address || ""],
    });
  }

  if (data.id || data.identifier || data.patientId) {
    patient.identifier.push({
      system: "http://hospital.smarthealthit.org/ids",
      value: data.id || data.identifier || data.patientId,
    });
  }

  return { patient, patientId };
};

// Create basic encounter resource
const createEncounterResource = (data, patientId) => {
  const encounterId = `encounter-${generateId()}`;

  const encounter = {
    resourceType: "Encounter",
    id: encounterId,
    status: "finished",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "AMB",
      display: "Ambulatory",
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
  };

  if (data.encounterDate || data.visitDate || data.date) {
    encounter.period = {
      start: data.encounterDate || data.visitDate || data.date,
    };
  }

  if (data.reason || data.reasonForVisit) {
    encounter.reasonCode = [
      {
        text: data.reason || data.reasonForVisit,
      },
    ];
  }

  return { encounter, encounterId };
};

// Create observation resources from data
const createObservationResources = (data, patientId, encounterId) => {
  const observations = [];

  // Blood pressure
  if (data.systolic || data.diastolic || data.bp || data.bloodPressure) {
    let systolic, diastolic;

    if (data.systolic && data.diastolic) {
      systolic = data.systolic;
      diastolic = data.diastolic;
    } else if (data.bp) {
      const bpMatch = data.bp.match(/(\d+)\/(\d+)/);
      if (bpMatch) {
        systolic = bpMatch[1];
        diastolic = bpMatch[2];
      }
    } else if (data.bloodPressure) {
      const bpMatch = data.bloodPressure.match(/(\d+)\/(\d+)/);
      if (bpMatch) {
        systolic = bpMatch[1];
        diastolic = bpMatch[2];
      }
    }

    if (systolic && diastolic) {
      observations.push({
        resourceType: "Observation",
        id: `bp-${generateId()}`,
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "85354-9",
              display: "Blood pressure panel",
            },
          ],
        },
        subject: {
          reference: `Patient/${patientId}`,
        },
        encounter: {
          reference: `Encounter/${encounterId}`,
        },
        component: [
          {
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "8480-6",
                  display: "Systolic blood pressure",
                },
              ],
            },
            valueQuantity: {
              value: parseInt(systolic),
              unit: "mmHg",
            },
          },
          {
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "8462-4",
                  display: "Diastolic blood pressure",
                },
              ],
            },
            valueQuantity: {
              value: parseInt(diastolic),
              unit: "mmHg",
            },
          },
        ],
      });
    }
  }

  // Handle any generic observations like heart rate, temperature, etc.
  const observationFields = [
    "heartRate",
    "temperature",
    "respiratoryRate",
    "weight",
    "height",
    "bmi",
    "glucose",
  ];
  const observationCodes = {
    heartRate: { code: "8867-4", display: "Heart rate", unit: "beats/min" },
    temperature: { code: "8310-5", display: "Body temperature", unit: "°C" },
    respiratoryRate: {
      code: "9279-1",
      display: "Respiratory rate",
      unit: "breaths/min",
    },
    weight: { code: "29463-7", display: "Body weight", unit: "kg" },
    height: { code: "8302-2", display: "Body height", unit: "cm" },
    bmi: { code: "39156-5", display: "Body mass index (BMI)", unit: "kg/m2" },
    glucose: { code: "2345-7", display: "Glucose", unit: "mg/dL" },
  };

  observationFields.forEach((field) => {
    if (data[field]) {
      observations.push({
        resourceType: "Observation",
        id: `${field}-${generateId()}`,
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: observationCodes[field].code,
              display: observationCodes[field].display,
            },
          ],
        },
        subject: {
          reference: `Patient/${patientId}`,
        },
        encounter: {
          reference: `Encounter/${encounterId}`,
        },
        valueQuantity: {
          value: parseFloat(data[field]),
          unit: observationCodes[field].unit,
        },
      });
    }
  });

  return observations;
};

// Create medication requests from data
const createMedicationRequests = (data, patientId, encounterId) => {
  const medications = [];

  // Check if there's a medications field or medication field
  if (data.medications || data.medication) {
    const medsArray = data.medications
      ? Array.isArray(data.medications)
        ? data.medications
        : [data.medications]
      : Array.isArray(data.medication)
      ? data.medication
      : [data.medication];

    medsArray.forEach((med) => {
      if (typeof med === "string") {
        medications.push({
          resourceType: "MedicationRequest",
          id: `med-${generateId()}`,
          status: "active",
          intent: "order",
          medicationCodeableConcept: {
            text: med,
          },
          subject: {
            reference: `Patient/${patientId}`,
          },
          encounter: {
            reference: `Encounter/${encounterId}`,
          },
        });
      }
    });
  }

  // Check for table data that might contain medications
  if (data.table && data.table.headers && data.table.rows) {
    const medNameIndex = data.table.headers.findIndex(
      (h) =>
        h.toLowerCase().includes("medication") ||
        h.toLowerCase().includes("drug")
    );

    if (medNameIndex >= 0) {
      data.table.rows.forEach((row) => {
        if (row[medNameIndex]) {
          medications.push({
            resourceType: "MedicationRequest",
            id: `med-${generateId()}`,
            status: "active",
            intent: "order",
            medicationCodeableConcept: {
              text: row[medNameIndex],
            },
            subject: {
              reference: `Patient/${patientId}`,
            },
            encounter: {
              reference: `Encounter/${encounterId}`,
            },
          });
        }
      });
    }
  }

  return medications;
};

// Main function to convert OCR data to FHIR Bundle
export const convertToFhirBundle = (ocrData) => {
  // Create bundle structure
  const bundle = {
    resourceType: "Bundle",
    type: "collection",
    entry: [],
  };

  // Create patient resource
  const { patient, patientId } = createPatientResource(ocrData);
  bundle.entry.push({ resource: patient });

  // Create encounter resource
  const { encounter, encounterId } = createEncounterResource(
    ocrData,
    patientId
  );
  bundle.entry.push({ resource: encounter });

  // Create observations
  const observations = createObservationResources(
    ocrData,
    patientId,
    encounterId
  );
  observations.forEach((obs) => {
    bundle.entry.push({ resource: obs });
  });

  // Create medication requests
  const medications = createMedicationRequests(ocrData, patientId, encounterId);
  medications.forEach((med) => {
    bundle.entry.push({ resource: med });
  });

  return bundle;
};

export default convertToFhirBundle;
