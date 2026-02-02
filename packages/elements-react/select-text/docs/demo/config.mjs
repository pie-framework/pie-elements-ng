export default {
  "demos": [
    {
      "id": "literature-theme",
      "title": "Literature - Identify Theme",
      "description": "Select sentences that best represent the story's theme with partial scoring",
      "tags": [
        "literature",
        "reading-comprehension",
        "theme",
        "partial-scoring"
      ],
      "model": {
        "id": "1",
        "element": "select-text",
        "feedback": {
          "correct": {
            "type": "default",
            "default": "Excellent! You identified the sentences that convey the story's central theme."
          },
          "incorrect": {
            "type": "default",
            "default": "Not quite. Review the passage and look for sentences that express perseverance and determination."
          },
          "partial": {
            "type": "default",
            "default": "Good start! You found some thematic sentences but missed others."
          }
        },
        "feedbackEnabled": true,
        "partialScoring": true,
        "maxSelections": 3,
        "mode": "sentence",
        "highlightChoices": true,
        "rationale": "<p>The theme of perseverance is best shown in these sentences: Natasha's internal dialogue about discipline, her moment of doubt followed by determination, and the final sentence showing her success after persistent effort.</p>",
        "rationaleEnabled": true,
        "prompt": "<p>Select the <strong>two or three</strong> sentences that <em>best</em> represent the theme of <strong>perseverance and determination</strong>.</p>",
        "promptEnabled": true,
        "toolbarEditorPosition": "bottom",
        "text": "She thought about what she had to do, struggling to rein in her wild, fearful thoughts. Coach Cummings always said that an undisciplined mind never scored a perfect 10. Natasha wanted to please her Coach, yet sometimes his approval wasn't as exciting as his anger. The gymnasts were unanimous about one thing: Coach Cummings's fits of disapproving rage were much more humorous to witness than his infrequent, backslapping moments of high praise. Just for a hair of a moment, Natasha wondered if she really wanted a perfect 10, so weary was she of trying for but never achieving one.\n\nAt last Natasha's moment arrived. The faces of past giants of gymnastics swam before her mind's eye, now razor-sharp with fierce determination. \"I am talented. I am not afraid. I will make a perfect 10,\" she spoke aloud to herself, as she approached the mat, dusted her hands with chalk to prevent slippage, and returned to her starting point. Suddenly, the din of the gymnasium was silent to her. Forcing all sound out of her mind, she focused on the gleaming balance beam ahead of her. Taking a deep breath, Natasha made her graceful, yet powerful approach, mounted the beam flawlessly, and executed her first perfect 10.",
        "tokens": [
          {
            "text": "Coach Cummings always said that an undisciplined mind never scored a perfect 10.",
            "start": 85,
            "end": 165,
            "correct": true
          },
          {
            "start": 166,
            "end": 253,
            "text": "Natasha wanted to please her Coach, yet sometimes his approval wasn't as exciting as his anger.",
            "correct": false
          },
          {
            "text": "Just for a hair of a moment, Natasha wondered if she really wanted a perfect 10, so weary was she of trying for but never achieving one.",
            "start": 449,
            "end": 585,
            "correct": false
          },
          {
            "text": "The faces of past giants of gymnastics swam before her mind's eye, now razor-sharp with fierce determination.",
            "start": 628,
            "end": 738,
            "correct": true
          },
          {
            "text": "\"I am talented. I am not afraid. I will make a perfect 10,\" she spoke aloud to herself, as she approached the mat, dusted her hands with chalk to prevent slippage, and returned to her starting point.",
            "start": 739,
            "end": 943,
            "correct": false
          },
          {
            "text": "Taking a deep breath, Natasha made her graceful, yet powerful approach, mounted the beam flawlessly, and executed her first perfect 10.",
            "start": 1088,
            "end": 1224,
            "correct": true
          }
        ],
        "teacherInstructions": "<p>This assessment evaluates students' ability to identify thematic elements in narrative text. Acceptable answers should reference perseverance, determination, or overcoming self-doubt.</p>",
        "teacherInstructionsEnabled": true,
        "rubricEnabled": false
      },
      "session": {
        "selectedTokens": []
      }
    },
    {
      "id": "math-word-problem",
      "title": "Math - Identify Key Information",
      "description": "Select sentences containing critical information for solving a math problem",
      "tags": [
        "math",
        "word-problem",
        "problem-solving",
        "math-rendering"
      ],
      "model": {
        "id": "2",
        "element": "select-text",
        "feedback": {
          "correct": {
            "type": "default",
            "default": "Perfect! You identified all the essential information needed to solve this problem."
          },
          "incorrect": {
            "type": "default",
            "default": "Review the problem. Which sentences contain numerical data needed for calculations?"
          },
          "partial": {
            "type": "default",
            "default": "You're on the right track. Make sure you've selected all sentences with numerical information."
          }
        },
        "feedbackEnabled": true,
        "partialScoring": true,
        "maxSelections": 0,
        "mode": "sentence",
        "highlightChoices": false,
        "rationale": "<p>To solve this problem, you need: the initial speed (60 mph), the acceleration duration and rate (10 seconds at 2 m/s\u00b2), and the final speed (90 mph). The information about the car's color and passenger count is irrelevant to the physics calculation.</p><p>Using the kinematic equation: \\(v = v_0 + at\\), where \\(v_0 = 60\\) mph \\(= 26.8\\) m/s, \\(a = 2\\) m/s\u00b2, and \\(t = 10\\) s.</p>",
        "rationaleEnabled": true,
        "prompt": "<p>Read the following passage and <strong>select all sentences</strong> that contain information <em>necessary</em> to calculate the car's final velocity.</p><p>Use the formula: \\(v = v_0 + at\\)</p>",
        "promptEnabled": true,
        "toolbarEditorPosition": "bottom",
        "text": "A red sports car is traveling down a highway. The car is initially moving at 60 miles per hour. There are two passengers in the vehicle. The driver accelerates uniformly at a rate of 2 meters per second squared for 10 seconds. The car's stereo is playing classical music. After the acceleration period, the speedometer reads 90 miles per hour. The weather is sunny with no clouds in sight.",
        "tokens": [
          {
            "text": "A red sports car is traveling down a highway.",
            "start": 0,
            "end": 45,
            "correct": false
          },
          {
            "text": "The car is initially moving at 60 miles per hour.",
            "start": 46,
            "end": 96,
            "correct": true
          },
          {
            "text": "There are two passengers in the vehicle.",
            "start": 97,
            "end": 137,
            "correct": false
          },
          {
            "text": "The driver accelerates uniformly at a rate of 2 meters per second squared for 10 seconds.",
            "start": 138,
            "end": 228,
            "correct": true
          },
          {
            "text": "The car's stereo is playing classical music.",
            "start": 229,
            "end": 273,
            "correct": false
          },
          {
            "text": "After the acceleration period, the speedometer reads 90 miles per hour.",
            "start": 274,
            "end": 346,
            "correct": true
          },
          {
            "text": "The weather is sunny with no clouds in sight.",
            "start": 347,
            "end": 392,
            "correct": false
          }
        ],
        "teacherInstructions": "<p>This problem assesses students' ability to distinguish relevant from irrelevant information in mathematical contexts. Students should identify the three sentences containing numerical data: initial velocity, acceleration parameters, and final velocity.</p>",
        "teacherInstructionsEnabled": true,
        "rubricEnabled": false
      },
      "session": {
        "selectedTokens": []
      }
    },
    {
      "id": "science-hypothesis",
      "title": "Science - Identify Hypothesis",
      "description": "Single selection exercise to identify a scientific hypothesis with math notation",
      "tags": [
        "science",
        "hypothesis",
        "scientific-method",
        "single-select"
      ],
      "model": {
        "id": "3",
        "element": "select-text",
        "feedback": {
          "correct": {
            "type": "default",
            "default": "Correct! This sentence states a testable prediction about the relationship between variables."
          },
          "incorrect": {
            "type": "default",
            "default": "Incorrect. A hypothesis should be a testable statement predicting a relationship between variables."
          }
        },
        "feedbackEnabled": true,
        "partialScoring": false,
        "maxSelections": 1,
        "mode": "sentence",
        "highlightChoices": true,
        "rationale": "<p>A hypothesis is a testable prediction. The sentence \"If the temperature increases by \\(\\Delta T = 10\\)\u00b0C, then the reaction rate will double\" is the only testable hypothesis in this passage. It predicts a specific, measurable relationship between two variables that can be experimentally verified.</p>",
        "rationaleEnabled": true,
        "prompt": "<p><strong>Select the ONE sentence</strong> that contains a proper scientific hypothesis.</p>",
        "promptEnabled": true,
        "toolbarEditorPosition": "bottom",
        "text": "Scientists have long studied chemical reaction rates. Temperature is an interesting variable to consider in experiments. If the temperature increases by 10 degrees Celsius, then the reaction rate will double. Many researchers work in laboratories around the world. The equipment used must be calibrated carefully. Previous studies have shown various results. Understanding these relationships helps us predict outcomes in industrial processes.",
        "tokens": [
          {
            "text": "Scientists have long studied chemical reaction rates.",
            "start": 0,
            "end": 53,
            "correct": false
          },
          {
            "text": "Temperature is an interesting variable to consider in experiments.",
            "start": 54,
            "end": 120,
            "correct": false
          },
          {
            "text": "If the temperature increases by 10 degrees Celsius, then the reaction rate will double.",
            "start": 121,
            "end": 209,
            "correct": true
          },
          {
            "text": "Many researchers work in laboratories around the world.",
            "start": 210,
            "end": 265,
            "correct": false
          },
          {
            "text": "The equipment used must be calibrated carefully.",
            "start": 266,
            "end": 314,
            "correct": false
          },
          {
            "text": "Previous studies have shown various results.",
            "start": 315,
            "end": 359,
            "correct": false
          },
          {
            "text": "Understanding these relationships helps us predict outcomes in industrial processes.",
            "start": 360,
            "end": 444,
            "correct": false
          }
        ],
        "teacherInstructions": "<p>This question tests students' understanding of the scientific method, specifically the characteristics of a proper hypothesis. A hypothesis must be testable and predict a relationship between variables.</p>",
        "teacherInstructionsEnabled": true,
        "rubricEnabled": false
      },
      "session": {
        "selectedTokens": []
      }
    },
    {
      "id": "history-evidence",
      "title": "History - Supporting Evidence",
      "description": "Identify sentences that support a historical claim without selection limits",
      "tags": [
        "history",
        "evidence",
        "critical-thinking",
        "unlimited-selection"
      ],
      "model": {
        "id": "4",
        "element": "select-text",
        "feedback": {
          "correct": {
            "type": "default",
            "default": "Excellent analysis! You identified all the evidence supporting the claim."
          },
          "incorrect": {
            "type": "default",
            "default": "Review the passage and look for specific facts that support the economic impact claim."
          },
          "partial": {
            "type": "default",
            "default": "Good effort! You found some supporting evidence but there's more to identify."
          }
        },
        "feedbackEnabled": true,
        "partialScoring": true,
        "maxSelections": 0,
        "mode": "sentence",
        "highlightChoices": false,
        "rationale": "<p>The claim states that the Industrial Revolution had a profound economic impact. Supporting evidence includes: the shift from agrarian to industrial economies, the rise of factories and mass production, increased urbanization and labor migration, and the emergence of new economic classes. These facts directly demonstrate significant economic changes during this period.</p>",
        "rationaleEnabled": true,
        "prompt": "<p><strong>Claim:</strong> The Industrial Revolution had a profound impact on economic structures in the 18th and 19th centuries.</p><p>Select <strong>all sentences</strong> that provide <em>direct evidence</em> supporting this claim.</p>",
        "promptEnabled": true,
        "toolbarEditorPosition": "bottom",
        "text": "The Industrial Revolution began in Britain in the late 1700s. It marked a major turning point in human history. Prior to this period, most people lived in rural areas and worked in agriculture. The invention of the steam engine revolutionized transportation. Factories began to emerge, enabling mass production of goods. The weather patterns during this time were relatively stable. Workers migrated from farms to cities in search of employment. This urbanization created new social dynamics. New economic classes emerged, including a wealthy industrial bourgeoisie and an urban working class. Many famous inventors lived during this era. The shift from manual labor to machine-based manufacturing fundamentally altered economic structures.",
        "tokens": [
          {
            "text": "The Industrial Revolution began in Britain in the late 1700s.",
            "start": 0,
            "end": 61,
            "correct": false
          },
          {
            "text": "It marked a major turning point in human history.",
            "start": 62,
            "end": 111,
            "correct": false
          },
          {
            "text": "Prior to this period, most people lived in rural areas and worked in agriculture.",
            "start": 112,
            "end": 193,
            "correct": true
          },
          {
            "text": "The invention of the steam engine revolutionized transportation.",
            "start": 194,
            "end": 258,
            "correct": false
          },
          {
            "text": "Factories began to emerge, enabling mass production of goods.",
            "start": 259,
            "end": 320,
            "correct": true
          },
          {
            "text": "The weather patterns during this time were relatively stable.",
            "start": 321,
            "end": 382,
            "correct": false
          },
          {
            "text": "Workers migrated from farms to cities in search of employment.",
            "start": 383,
            "end": 445,
            "correct": true
          },
          {
            "text": "This urbanization created new social dynamics.",
            "start": 446,
            "end": 492,
            "correct": false
          },
          {
            "text": "New economic classes emerged, including a wealthy industrial bourgeoisie and an urban working class.",
            "start": 493,
            "end": 594,
            "correct": true
          },
          {
            "text": "Many famous inventors lived during this era.",
            "start": 595,
            "end": 639,
            "correct": false
          },
          {
            "text": "The shift from manual labor to machine-based manufacturing fundamentally altered economic structures.",
            "start": 640,
            "end": 741,
            "correct": true
          }
        ],
        "teacherInstructions": "<p>This exercise develops critical thinking skills by asking students to distinguish between supporting evidence and contextual information. Students should identify sentences that directly demonstrate economic changes: the agrarian baseline, factory emergence, labor migration, new economic classes, and the fundamental shift in economic structures.</p>",
        "teacherInstructionsEnabled": true,
        "rubricEnabled": false
      },
      "session": {
        "selectedTokens": []
      }
    }
  ]
};