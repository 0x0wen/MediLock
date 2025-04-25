/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/medilock.json`.
 */
export const IDL = {
 "address": "BqwVrtrJvBw5GDv8gJkyJpHp1BQc9sq1DexacBNPC3tB",
 "metadata": {
   "name": "medilock",
   "version": "0.1.0",
   "spec": "0.1.0",
   "description": "Created with Anchor"
 },
 "instructions": [
   {
     "name": "add_pool",
     "discriminator": [
       115,
       230,
       212,
       211,
       175,
       49,
       39,
       169
     ],
     "accounts": [
       {
         "name": "pool",
         "writable": true,
         "pda": {
           "seeds": [
             {
               "kind": "const",
               "value": [
                 112,
                 111,
                 111,
                 108
               ]
             },
             {
               "kind": "account",
               "path": "creator"
             },
             {
               "kind": "arg",
               "path": "id"
             }
           ]
         }
       },
       {
         "name": "creator",
         "writable": true,
         "signer": true
       },
       {
         "name": "system_program",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": [
       {
         "name": "id",
         "type": "u64"
       },
       {
         "name": "name",
         "type": "string"
       },
       {
         "name": "description",
         "type": "string"
       },
       {
         "name": "price_per_record",
         "type": "u64"
       },
       {
         "name": "total_needed",
         "type": "u64"
       }
     ]
   },
   {
     "name": "add_record",
     "discriminator": [
       65,
       186,
       219,
       131,
       44,
       66,
       61,
       216
     ],
     "accounts": [
       {
         "name": "record_account",
         "writable": true
       },
       {
         "name": "doctor_account",
         "writable": true
       },
       {
         "name": "patient_account",
         "writable": true
       },
       {
         "name": "authority",
         "writable": true,
         "signer": true
       },
       {
         "name": "system_program",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": [
       {
         "name": "record_counter",
         "type": "u8"
       },
       {
         "name": "cid",
         "type": "string"
       },
       {
         "name": "metadata",
         "type": "string"
       }
     ]
   },
   {
     "name": "contribute",
     "discriminator": [
       82,
       33,
       68,
       131,
       32,
       0,
       205,
       95
     ],
     "accounts": [
       {
         "name": "pool",
         "writable": true
       },
       {
         "name": "contribution",
         "writable": true,
         "pda": {
           "seeds": [
             {
               "kind": "const",
               "value": [
                 99,
                 111,
                 110,
                 116,
                 114,
                 105,
                 98,
                 117,
                 116,
                 105,
                 111,
                 110
               ]
             },
             {
               "kind": "account",
               "path": "pool.id",
               "account": "DataPool"
             },
             {
               "kind": "arg",
               "path": "record_id"
             },
             {
               "kind": "account",
               "path": "contributor"
             }
           ]
         }
       },
       {
         "name": "contributor",
         "writable": true,
         "signer": true
       },
       {
         "name": "system_program",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": [
       {
         "name": "record_id",
         "type": "u64"
       }
     ]
   },
   {
     "name": "initialize",
     "discriminator": [
       175,
       175,
       109,
       31,
       13,
       152,
       155,
       237
     ],
     "accounts": [
       {
         "name": "authority",
         "writable": true,
         "signer": true
       },
       {
         "name": "system_program",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": []
   },
   {
     "name": "register",
     "discriminator": [
       211,
       124,
       67,
       15,
       211,
       194,
       178,
       240
     ],
     "accounts": [
       {
         "name": "user_account",
         "writable": true,
         "pda": {
           "seeds": [
             {
               "kind": "const",
               "value": [
                 117,
                 115,
                 101,
                 114
               ]
             },
             {
               "kind": "account",
               "path": "authority"
             }
           ]
         }
       },
       {
         "name": "authority",
         "writable": true,
         "signer": true
       },
       {
         "name": "system_program",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": [
       {
         "name": "nik",
         "type": "string"
       },
       {
         "name": "full_name",
         "type": "string"
       },
       {
         "name": "blood_type",
         "type": "string"
       },
       {
         "name": "birthdate",
         "type": "i64"
       },
       {
         "name": "gender",
         "type": {
           "defined": {
             "name": "Gender"
           }
         }
       },
       {
         "name": "email",
         "type": "string"
       },
       {
         "name": "phone_number",
         "type": "string"
       }
     ]
   },
   {
     "name": "request_access",
     "discriminator": [
       102,
       165,
       38,
       148,
       139,
       189,
       106,
       47
     ],
     "accounts": [
       {
         "name": "access_request",
         "writable": true,
         "pda": {
           "seeds": [
             {
               "kind": "const",
               "value": [
                 97,
                 99,
                 99,
                 101,
                 115,
                 115
               ]
             },
             {
               "kind": "account",
               "path": "doctor_account"
             },
             {
               "kind": "account",
               "path": "patient_account"
             }
           ]
         }
       },
       {
         "name": "doctor_account"
       },
       {
         "name": "patient_account"
       },
       {
         "name": "authority",
         "writable": true,
         "signer": true
       },
       {
         "name": "system_program",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": [
       {
         "name": "scope",
         "type": "string"
       },
       {
         "name": "expiration",
         "type": "i64"
       }
     ]
   },
   {
     "name": "respond_access",
     "discriminator": [
       113,
       160,
       97,
       129,
       140,
       17,
       132,
       169
     ],
     "accounts": [
       {
         "name": "access_request",
         "writable": true,
         "pda": {
           "seeds": [
             {
               "kind": "const",
               "value": [
                 97,
                 99,
                 99,
                 101,
                 115,
                 115
               ]
             },
             {
               "kind": "account",
               "path": "doctor_account"
             },
             {
               "kind": "account",
               "path": "patient_account"
             }
           ]
         }
       },
       {
         "name": "doctor_account"
       },
       {
         "name": "patient_account"
       },
       {
         "name": "authority",
         "writable": true,
         "signer": true
       },
       {
         "name": "system_program",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": [
       {
         "name": "approved",
         "type": "bool"
       }
     ]
   },
   {
     "name": "withdraw",
     "discriminator": [
       183,
       18,
       70,
       156,
       148,
       109,
       161,
       34
     ],
     "accounts": [
       {
         "name": "contribution",
         "writable": true
       },
       {
         "name": "pool",
         "writable": true
       },
       {
         "name": "contributor",
         "writable": true,
         "signer": true
       },
       {
         "name": "pool_vault",
         "writable": true,
         "pda": {
           "seeds": [
             {
               "kind": "const",
               "value": [
                 118,
                 97,
                 117,
                 108,
                 116
               ]
             },
             {
               "kind": "account",
               "path": "pool"
             }
           ]
         }
       },
       {
         "name": "system_program",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": []
   }
 ],
 "accounts": [
   {
     "name": "AccessRequest",
     "discriminator": [
       165,
       109,
       87,
       16,
       193,
       252,
       188,
       174
     ]
   },
   {
     "name": "Contribution",
     "discriminator": [
       182,
       187,
       14,
       111,
       72,
       167,
       242,
       212
     ]
   },
   {
     "name": "DataPool",
     "discriminator": [
       49,
       159,
       183,
       126,
       150,
       198,
       228,
       133
     ]
   },
   {
     "name": "MedicalRecord",
     "discriminator": [
       30,
       152,
       224,
       245,
       112,
       161,
       115,
       55
     ]
   },
   {
     "name": "User",
     "discriminator": [
       159,
       117,
       95,
       227,
       239,
       151,
       58,
       236
     ]
   }
 ],
 "events": [
   {
     "name": "AccessLogged",
     "discriminator": [
       243,
       53,
       225,
       71,
       64,
       120,
       109,
       25
     ]
   },
   {
     "name": "AccessRequestResponded",
     "discriminator": [
       151,
       72,
       74,
       57,
       179,
       13,
       46,
       41
     ]
   },
   {
     "name": "AccessRequested",
     "discriminator": [
       70,
       226,
       202,
       24,
       4,
       226,
       156,
       130
     ]
   },
   {
     "name": "RecordAdded",
     "discriminator": [
       220,
       101,
       67,
       16,
       19,
       60,
       90,
       35
     ]
   },
   {
     "name": "UserRegistered",
     "discriminator": [
       21,
       42,
       216,
       163,
       99,
       51,
       200,
       222
     ]
   }
 ],
 "errors": [
   {
     "code": 6000,
     "name": "UnauthorizedRole",
     "msg": "Unauthorized role for this operation"
   },
   {
     "code": 6001,
     "name": "UnauthorizedAccess",
     "msg": "Unauthorized access"
   },
   {
     "code": 6002,
     "name": "AccessDenied",
     "msg": "Access denied"
   },
   {
     "code": 6003,
     "name": "AccessExpired",
     "msg": "Access has expired"
   },
   {
     "code": 6004,
     "name": "PoolFull",
     "msg": "Pool has already collected the maximum number of contributions."
   },
   {
     "code": 6005,
     "name": "AlreadyPaid",
     "msg": "This contribution has already been paid out."
   }
 ],
 "types": [
   {
     "name": "AccessLogged",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "record_cid",
           "type": "string"
         },
         {
           "name": "user_did",
           "type": "string"
         },
         {
           "name": "action",
           "type": "string"
         },
         {
           "name": "timestamp",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "AccessRequest",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "doctor_did",
           "type": "string"
         },
         {
           "name": "patient_did",
           "type": "string"
         },
         {
           "name": "requested_at",
           "type": "i64"
         },
         {
           "name": "scope",
           "type": "string"
         },
         {
           "name": "expires_at",
           "type": "i64"
         },
         {
           "name": "status",
           "type": {
             "defined": {
               "name": "RequestStatus"
             }
           }
         },
         {
           "name": "responded_at",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "AccessRequestResponded",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "doctor_did",
           "type": "string"
         },
         {
           "name": "patient_did",
           "type": "string"
         },
         {
           "name": "approved",
           "type": "bool"
         },
         {
           "name": "timestamp",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "AccessRequested",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "doctor_did",
           "type": "string"
         },
         {
           "name": "patient_did",
           "type": "string"
         },
         {
           "name": "timestamp",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "Contribution",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "id",
           "type": "u64"
         },
         {
           "name": "pool_id",
           "type": "u64"
         },
         {
           "name": "record_id",
           "type": "u64"
         },
         {
           "name": "contributor",
           "type": "pubkey"
         },
         {
           "name": "paid",
           "type": "bool"
         }
       ]
     }
   },
   {
     "name": "DataPool",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "id",
           "type": "u64"
         },
         {
           "name": "creator",
           "type": "pubkey"
         },
         {
           "name": "name",
           "type": "string"
         },
         {
           "name": "description",
           "type": "string"
         },
         {
           "name": "price_per_record",
           "type": "u64"
         },
         {
           "name": "total_needed",
           "type": "u64"
         },
         {
           "name": "collected",
           "type": "u64"
         }
       ]
     }
   },
   {
     "name": "Gender",
     "type": {
       "kind": "enum",
       "variants": [
         {
           "name": "Male"
         },
         {
           "name": "Female"
         },
         {
           "name": "Other"
         }
       ]
     }
   },
   {
     "name": "MedicalRecord",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "cid",
           "type": "string"
         },
         {
           "name": "doctor_did",
           "type": "string"
         },
         {
           "name": "patient_did",
           "type": "string"
         },
         {
           "name": "timestamp",
           "type": "i64"
         },
         {
           "name": "metadata",
           "type": "string"
         }
       ]
     }
   },
   {
     "name": "RecordAdded",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "cid",
           "type": "string"
         },
         {
           "name": "patient_did",
           "type": "string"
         },
         {
           "name": "doctor_did",
           "type": "string"
         },
         {
           "name": "timestamp",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "RequestStatus",
     "type": {
       "kind": "enum",
       "variants": [
         {
           "name": "Pending"
         },
         {
           "name": "Approved"
         },
         {
           "name": "Denied"
         }
       ]
     }
   },
   {
     "name": "User",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "public_key",
           "type": "pubkey"
         },
         {
           "name": "nik",
           "type": "string"
         },
         {
           "name": "full_name",
           "type": "string"
         },
         {
           "name": "blood_type",
           "type": "string"
         },
         {
           "name": "birthdate",
           "type": "i64"
         },
         {
           "name": "gender",
           "type": {
             "defined": {
               "name": "Gender"
             }
           }
         },
         {
           "name": "email",
           "type": "string"
         },
         {
           "name": "phone_number",
           "type": "string"
         },
         {
           "name": "role",
           "type": {
             "defined": {
               "name": "UserRole"
             }
           }
         },
         {
           "name": "created_at",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "UserRegistered",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "nik",
           "type": "string"
         },
         {
           "name": "full_name",
           "type": "string"
         },
         {
           "name": "role",
           "type": {
             "defined": {
               "name": "UserRole"
             }
           }
         },
         {
           "name": "email",
           "type": "string"
         },
         {
           "name": "timestamp",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "UserRole",
     "type": {
       "kind": "enum",
       "variants": [
         {
           "name": "Patient"
         },
         {
           "name": "Doctor"
         }
       ]
     }
   }
 ],
 "constants": [
   {
     "name": "SEED",
     "type": "string",
     "value": "\"anchor\""
   }
 ]
}
export type Medilock = {
 "address": "BqwVrtrJvBw5GDv8gJkyJpHp1BQc9sq1DexacBNPC3tB",
 "metadata": {
   "name": "medilock",
   "version": "0.1.0",
   "spec": "0.1.0",
   "description": "Created with Anchor"
 },
 "instructions": [
   {
     "name": "addPool",
     "discriminator": [
       115,
       230,
       212,
       211,
       175,
       49,
       39,
       169
     ],
     "accounts": [
       {
         "name": "pool",
         "writable": true,
         "pda": {
           "seeds": [
             {
               "kind": "const",
               "value": [
                 112,
                 111,
                 111,
                 108
               ]
             },
             {
               "kind": "account",
               "path": "creator"
             },
             {
               "kind": "arg",
               "path": "id"
             }
           ]
         }
       },
       {
         "name": "creator",
         "writable": true,
         "signer": true
       },
       {
         "name": "systemProgram",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": [
       {
         "name": "id",
         "type": "u64"
       },
       {
         "name": "name",
         "type": "string"
       },
       {
         "name": "description",
         "type": "string"
       },
       {
         "name": "pricePerRecord",
         "type": "u64"
       },
       {
         "name": "totalNeeded",
         "type": "u64"
       }
     ]
   },
   {
     "name": "addRecord",
     "discriminator": [
       65,
       186,
       219,
       131,
       44,
       66,
       61,
       216
     ],
     "accounts": [
       {
         "name": "recordAccount",
         "writable": true
       },
       {
         "name": "doctorAccount",
         "writable": true
       },
       {
         "name": "patientAccount",
         "writable": true
       },
       {
         "name": "authority",
         "writable": true,
         "signer": true
       },
       {
         "name": "systemProgram",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": [
       {
         "name": "recordCounter",
         "type": "u8"
       },
       {
         "name": "cid",
         "type": "string"
       },
       {
         "name": "metadata",
         "type": "string"
       }
     ]
   },
   {
     "name": "contribute",
     "discriminator": [
       82,
       33,
       68,
       131,
       32,
       0,
       205,
       95
     ],
     "accounts": [
       {
         "name": "pool",
         "writable": true
       },
       {
         "name": "contribution",
         "writable": true,
         "pda": {
           "seeds": [
             {
               "kind": "const",
               "value": [
                 99,
                 111,
                 110,
                 116,
                 114,
                 105,
                 98,
                 117,
                 116,
                 105,
                 111,
                 110
               ]
             },
             {
               "kind": "account",
               "path": "pool.id",
               "account": "dataPool"
             },
             {
               "kind": "arg",
               "path": "recordId"
             },
             {
               "kind": "account",
               "path": "contributor"
             }
           ]
         }
       },
       {
         "name": "contributor",
         "writable": true,
         "signer": true
       },
       {
         "name": "systemProgram",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": [
       {
         "name": "recordId",
         "type": "u64"
       }
     ]
   },
   {
     "name": "initialize",
     "discriminator": [
       175,
       175,
       109,
       31,
       13,
       152,
       155,
       237
     ],
     "accounts": [
       {
         "name": "authority",
         "writable": true,
         "signer": true
       },
       {
         "name": "systemProgram",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": []
   },
   {
     "name": "register",
     "discriminator": [
       211,
       124,
       67,
       15,
       211,
       194,
       178,
       240
     ],
     "accounts": [
       {
         "name": "userAccount",
         "writable": true,
         "pda": {
           "seeds": [
             {
               "kind": "const",
               "value": [
                 117,
                 115,
                 101,
                 114
               ]
             },
             {
               "kind": "account",
               "path": "authority"
             }
           ]
         }
       },
       {
         "name": "authority",
         "writable": true,
         "signer": true
       },
       {
         "name": "systemProgram",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": [
       {
         "name": "nik",
         "type": "string"
       },
       {
         "name": "fullName",
         "type": "string"
       },
       {
         "name": "bloodType",
         "type": "string"
       },
       {
         "name": "birthdate",
         "type": "i64"
       },
       {
         "name": "gender",
         "type": {
           "defined": {
             "name": "gender"
           }
         }
       },
       {
         "name": "email",
         "type": "string"
       },
       {
         "name": "phoneNumber",
         "type": "string"
       }
     ]
   },
   {
     "name": "requestAccess",
     "discriminator": [
       102,
       165,
       38,
       148,
       139,
       189,
       106,
       47
     ],
     "accounts": [
       {
         "name": "accessRequest",
         "writable": true,
         "pda": {
           "seeds": [
             {
               "kind": "const",
               "value": [
                 97,
                 99,
                 99,
                 101,
                 115,
                 115
               ]
             },
             {
               "kind": "account",
               "path": "doctorAccount"
             },
             {
               "kind": "account",
               "path": "patientAccount"
             }
           ]
         }
       },
       {
         "name": "doctorAccount"
       },
       {
         "name": "patientAccount"
       },
       {
         "name": "authority",
         "writable": true,
         "signer": true
       },
       {
         "name": "systemProgram",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": [
       {
         "name": "scope",
         "type": "string"
       },
       {
         "name": "expiration",
         "type": "i64"
       }
     ]
   },
   {
     "name": "respondAccess",
     "discriminator": [
       113,
       160,
       97,
       129,
       140,
       17,
       132,
       169
     ],
     "accounts": [
       {
         "name": "accessRequest",
         "writable": true,
         "pda": {
           "seeds": [
             {
               "kind": "const",
               "value": [
                 97,
                 99,
                 99,
                 101,
                 115,
                 115
               ]
             },
             {
               "kind": "account",
               "path": "doctorAccount"
             },
             {
               "kind": "account",
               "path": "patientAccount"
             }
           ]
         }
       },
       {
         "name": "doctorAccount"
       },
       {
         "name": "patientAccount"
       },
       {
         "name": "authority",
         "writable": true,
         "signer": true
       },
       {
         "name": "systemProgram",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": [
       {
         "name": "approved",
         "type": "bool"
       }
     ]
   },
   {
     "name": "withdraw",
     "discriminator": [
       183,
       18,
       70,
       156,
       148,
       109,
       161,
       34
     ],
     "accounts": [
       {
         "name": "contribution",
         "writable": true
       },
       {
         "name": "pool",
         "writable": true
       },
       {
         "name": "contributor",
         "writable": true,
         "signer": true
       },
       {
         "name": "poolVault",
         "writable": true,
         "pda": {
           "seeds": [
             {
               "kind": "const",
               "value": [
                 118,
                 97,
                 117,
                 108,
                 116
               ]
             },
             {
               "kind": "account",
               "path": "pool"
             }
           ]
         }
       },
       {
         "name": "systemProgram",
         "address": "11111111111111111111111111111111"
       }
     ],
     "args": []
   }
 ],
 "accounts": [
   {
     "name": "accessRequest",
     "discriminator": [
       165,
       109,
       87,
       16,
       193,
       252,
       188,
       174
     ]
   },
   {
     "name": "contribution",
     "discriminator": [
       182,
       187,
       14,
       111,
       72,
       167,
       242,
       212
     ]
   },
   {
     "name": "dataPool",
     "discriminator": [
       49,
       159,
       183,
       126,
       150,
       198,
       228,
       133
     ]
   },
   {
     "name": "medicalRecord",
     "discriminator": [
       30,
       152,
       224,
       245,
       112,
       161,
       115,
       55
     ]
   },
   {
     "name": "user",
     "discriminator": [
       159,
       117,
       95,
       227,
       239,
       151,
       58,
       236
     ]
   }
 ],
 "events": [
   {
     "name": "accessLogged",
     "discriminator": [
       243,
       53,
       225,
       71,
       64,
       120,
       109,
       25
     ]
   },
   {
     "name": "accessRequestResponded",
     "discriminator": [
       151,
       72,
       74,
       57,
       179,
       13,
       46,
       41
     ]
   },
   {
     "name": "accessRequested",
     "discriminator": [
       70,
       226,
       202,
       24,
       4,
       226,
       156,
       130
     ]
   },
   {
     "name": "recordAdded",
     "discriminator": [
       220,
       101,
       67,
       16,
       19,
       60,
       90,
       35
     ]
   },
   {
     "name": "userRegistered",
     "discriminator": [
       21,
       42,
       216,
       163,
       99,
       51,
       200,
       222
     ]
   }
 ],
 "errors": [
   {
     "code": 6000,
     "name": "unauthorizedRole",
     "msg": "Unauthorized role for this operation"
   },
   {
     "code": 6001,
     "name": "unauthorizedAccess",
     "msg": "Unauthorized access"
   },
   {
     "code": 6002,
     "name": "accessDenied",
     "msg": "Access denied"
   },
   {
     "code": 6003,
     "name": "accessExpired",
     "msg": "Access has expired"
   },
   {
     "code": 6004,
     "name": "poolFull",
     "msg": "Pool has already collected the maximum number of contributions."
   },
   {
     "code": 6005,
     "name": "alreadyPaid",
     "msg": "This contribution has already been paid out."
   }
 ],
 "types": [
   {
     "name": "accessLogged",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "recordCid",
           "type": "string"
         },
         {
           "name": "userDid",
           "type": "string"
         },
         {
           "name": "action",
           "type": "string"
         },
         {
           "name": "timestamp",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "accessRequest",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "doctorDid",
           "type": "string"
         },
         {
           "name": "patientDid",
           "type": "string"
         },
         {
           "name": "requestedAt",
           "type": "i64"
         },
         {
           "name": "scope",
           "type": "string"
         },
         {
           "name": "expiresAt",
           "type": "i64"
         },
         {
           "name": "status",
           "type": {
             "defined": {
               "name": "requestStatus"
             }
           }
         },
         {
           "name": "respondedAt",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "accessRequestResponded",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "doctorDid",
           "type": "string"
         },
         {
           "name": "patientDid",
           "type": "string"
         },
         {
           "name": "approved",
           "type": "bool"
         },
         {
           "name": "timestamp",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "accessRequested",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "doctorDid",
           "type": "string"
         },
         {
           "name": "patientDid",
           "type": "string"
         },
         {
           "name": "timestamp",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "contribution",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "id",
           "type": "u64"
         },
         {
           "name": "poolId",
           "type": "u64"
         },
         {
           "name": "recordId",
           "type": "u64"
         },
         {
           "name": "contributor",
           "type": "pubkey"
         },
         {
           "name": "paid",
           "type": "bool"
         }
       ]
     }
   },
   {
     "name": "dataPool",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "id",
           "type": "u64"
         },
         {
           "name": "creator",
           "type": "pubkey"
         },
         {
           "name": "name",
           "type": "string"
         },
         {
           "name": "description",
           "type": "string"
         },
         {
           "name": "pricePerRecord",
           "type": "u64"
         },
         {
           "name": "totalNeeded",
           "type": "u64"
         },
         {
           "name": "collected",
           "type": "u64"
         }
       ]
     }
   },
   {
     "name": "gender",
     "type": {
       "kind": "enum",
       "variants": [
         {
           "name": "male"
         },
         {
           "name": "female"
         },
         {
           "name": "other"
         }
       ]
     }
   },
   {
     "name": "medicalRecord",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "cid",
           "type": "string"
         },
         {
           "name": "doctorDid",
           "type": "string"
         },
         {
           "name": "patientDid",
           "type": "string"
         },
         {
           "name": "timestamp",
           "type": "i64"
         },
         {
           "name": "metadata",
           "type": "string"
         }
       ]
     }
   },
   {
     "name": "recordAdded",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "cid",
           "type": "string"
         },
         {
           "name": "patientDid",
           "type": "string"
         },
         {
           "name": "doctorDid",
           "type": "string"
         },
         {
           "name": "timestamp",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "requestStatus",
     "type": {
       "kind": "enum",
       "variants": [
         {
           "name": "pending"
         },
         {
           "name": "approved"
         },
         {
           "name": "denied"
         }
       ]
     }
   },
   {
     "name": "user",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "publicKey",
           "type": "pubkey"
         },
         {
           "name": "nik",
           "type": "string"
         },
         {
           "name": "fullName",
           "type": "string"
         },
         {
           "name": "bloodType",
           "type": "string"
         },
         {
           "name": "birthdate",
           "type": "i64"
         },
         {
           "name": "gender",
           "type": {
             "defined": {
               "name": "gender"
             }
           }
         },
         {
           "name": "email",
           "type": "string"
         },
         {
           "name": "phoneNumber",
           "type": "string"
         },
         {
           "name": "role",
           "type": {
             "defined": {
               "name": "userRole"
             }
           }
         },
         {
           "name": "createdAt",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "userRegistered",
     "type": {
       "kind": "struct",
       "fields": [
         {
           "name": "nik",
           "type": "string"
         },
         {
           "name": "fullName",
           "type": "string"
         },
         {
           "name": "role",
           "type": {
             "defined": {
               "name": "userRole"
             }
           }
         },
         {
           "name": "email",
           "type": "string"
         },
         {
           "name": "timestamp",
           "type": "i64"
         }
       ]
     }
   },
   {
     "name": "userRole",
     "type": {
       "kind": "enum",
       "variants": [
         {
           "name": "patient"
         },
         {
           "name": "doctor"
         }
       ]
     }
   }
 ],
 "constants": [
   {
     "name": "seed",
     "type": "string",
     "value": "\"anchor\""
   }
 ]
};
