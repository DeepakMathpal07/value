import mongoose from "mongoose";

const individualProfileSchema = new mongoose.Schema({
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    userImage: {
      type: String
    },
    profileURL: {
      type: String
    },
    hUserId: {
      type: String
    },
    education: {
      type:Array
    },
    workHistory: {
      type:Array
    },
    persona: {
      details: {
        actionOrientedness: {
          score: {
            type: Number
          },
          level: {
            type: String
          }
        },
        attitudeAndOutlook: {
          score: {
            type: Number
          },
          level: {
            type: String
          }
        },
        generalBehavior: {
          score: {
            type: Number
          },
          level: {
            type: String
          }
        },
        stabilityPotential: {
          score: {
            type: Number
          },
          level: {
            type: String
          }
        },
        teamWorkSkills: {
          score: {
            type: Number
          },
          level: {
            type: String
          }
        },
        learningAbility: {
          score: {
            type: Number
          },
          level: {
            type: String
          }
        },
        needForAutonomy: {
          score: {
            type: Number
          },
          level: {
            type: String
          }
        }
      }
    },
    disc: {
      details: {
        type: Array
      },
      summary: {
        labels: {
          type: [
            String
          ]
        },
        description: {
          type: [
            String
          ]
        }
      }
    },
    ocean: {
      summary: {
        labels: {
          type: [
            String
          ]
        },
        description: {
          type: [
            String
          ]
        }
      },
      details: {
        type: Array
      }
    },
    profileStatus: {
      type: String
    },
    prographics: {
      experience: {
        type: Number
      },
      educationLevel: {
        type: Number
      }
    },
    confidenceScore: {
      type: Number
    },
    confidenceLevel: {
      type: String
    },
    _class: {
      type: String
    }
  },
  {
    collection: 'individualProfiles' // Replace with your desired collection name
  }
);
const IndividualProfile = mongoose.model('IndividualProfile', individualProfileSchema);

export default IndividualProfile;
