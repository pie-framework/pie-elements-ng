export default {
  "demos": [
    {
      "id": "algebra-quadratic",
      "title": "Algebra: Solving Quadratic Equations",
      "description": "Two-part question testing understanding of quadratic equations with factoring and solutions",
      "tags": [
        "math",
        "algebra",
        "quadratic",
        "radio",
        "two-part"
      ],
      "model": {
        "id": "1",
        "element": "ebsr",
        "partLabels": true,
        "partLabelType": "Letters",
        "partA": {
          "choiceMode": "radio",
          "choicePrefix": "letters",
          "choices": [
            {
              "correct": false,
              "value": "opt1",
              "label": "\\((x + 2)(x + 3)\\)",
              "feedback": {
                "type": "default",
                "value": "Incorrect. Check the signs of the factors."
              },
              "rationale": "When expanded, this gives \\(x^2 + 5x + 6\\), not \\(x^2 + x - 6\\)."
            },
            {
              "correct": true,
              "value": "opt2",
              "label": "\\((x + 3)(x - 2)\\)",
              "feedback": {
                "type": "default",
                "value": "Correct! This is the proper factorization."
              },
              "rationale": "Expanding \\((x + 3)(x - 2)\\) gives \\(x^2 - 2x + 3x - 6 = x^2 + x - 6\\), which matches the original expression."
            },
            {
              "correct": false,
              "value": "opt3",
              "label": "\\((x - 3)(x + 2)\\)",
              "feedback": {
                "type": "default",
                "value": "Incorrect. The factors are reversed."
              },
              "rationale": "This expands to \\(x^2 - x - 6\\), which has the wrong sign for the middle term."
            },
            {
              "correct": false,
              "value": "opt4",
              "label": "\\((x - 3)(x - 2)\\)",
              "feedback": {
                "type": "default",
                "value": "Incorrect. Both signs are wrong."
              },
              "rationale": "This expands to \\(x^2 - 5x + 6\\), which is not equivalent to the original."
            }
          ],
          "prompt": "<p>Factor the quadratic expression \\(x^2 + x - 6\\).</p><p>Select the correct factored form:</p>",
          "promptEnabled": true,
          "feedbackEnabled": true,
          "rationaleEnabled": true,
          "teacherInstructions": "<p>This question assesses student ability to factor quadratic expressions into binomial factors.</p>",
          "teacherInstructionsEnabled": true
        },
        "partB": {
          "choiceMode": "checkbox",
          "choicePrefix": "letters",
          "choices": [
            {
              "correct": false,
              "value": "sol1",
              "label": "\\(x = 2\\)",
              "feedback": {
                "type": "default",
                "value": "Incorrect. Check your solution by substituting back."
              },
              "rationale": "If \\(x = 2\\), then \\((2 + 3)(2 - 2) = 5 \\cdot 0 = 0\\), but we need both factors to be checked independently."
            },
            {
              "correct": true,
              "value": "sol2",
              "label": "\\(x = -3\\)",
              "feedback": {
                "type": "default",
                "value": "Correct! This is one of the solutions."
              },
              "rationale": "Setting \\(x + 3 = 0\\) gives \\(x = -3\\). Substituting: \\((-3)^2 + (-3) - 6 = 9 - 3 - 6 = 0\\)."
            },
            {
              "correct": true,
              "value": "sol3",
              "label": "\\(x = 2\\)",
              "feedback": {
                "type": "default",
                "value": "Correct! This is the other solution."
              },
              "rationale": "Setting \\(x - 2 = 0\\) gives \\(x = 2\\). Substituting: \\((2)^2 + (2) - 6 = 4 + 2 - 6 = 0\\)."
            },
            {
              "correct": false,
              "value": "sol4",
              "label": "\\(x = 3\\)",
              "feedback": {
                "type": "default",
                "value": "Incorrect. This doesn't satisfy the equation."
              },
              "rationale": "If \\(x = 3\\), then \\((3)^2 + (3) - 6 = 9 + 3 - 6 = 6 \\neq 0\\)."
            }
          ],
          "prompt": "<p>Based on your factorization in Part A, select ALL values of \\(x\\) that make the equation \\(x^2 + x - 6 = 0\\) true.</p>",
          "promptEnabled": true,
          "feedbackEnabled": true,
          "rationaleEnabled": true,
          "teacherInstructions": "<p>Students must use their factorization to find the zeros by setting each factor equal to zero.</p>",
          "teacherInstructionsEnabled": true
        }
      },
      "session": {
        "value": {
          "partA": {
            "id": "partA",
            "value": []
          },
          "partB": {
            "id": "partB",
            "value": []
          }
        }
      }
    },
    {
      "id": "geometry-area",
      "title": "Geometry: Area and Perimeter",
      "description": "Two-part question connecting geometric formulas to problem-solving",
      "tags": [
        "math",
        "geometry",
        "area",
        "perimeter",
        "mixed-mode"
      ],
      "model": {
        "id": "2",
        "element": "ebsr",
        "partLabels": true,
        "partLabelType": "Numbers",
        "partA": {
          "choiceMode": "radio",
          "choicePrefix": "numbers",
          "choices": [
            {
              "correct": false,
              "value": "formula1",
              "label": "\\(A = 2l + 2w\\)",
              "feedback": {
                "type": "default",
                "value": "Incorrect. This is the formula for perimeter."
              },
              "rationale": "The formula \\(2l + 2w\\) calculates the perimeter (distance around) not the area (space inside)."
            },
            {
              "correct": true,
              "value": "formula2",
              "label": "\\(A = l \\times w\\)",
              "feedback": {
                "type": "default",
                "value": "Correct! Area equals length times width."
              },
              "rationale": "For a rectangle, the area is calculated by multiplying the length by the width: \\(A = l \\times w\\)."
            },
            {
              "correct": false,
              "value": "formula3",
              "label": "\\(A = \\frac{1}{2}bh\\)",
              "feedback": {
                "type": "default",
                "value": "Incorrect. This is the formula for a triangle's area."
              },
              "rationale": "The formula \\(\\frac{1}{2}bh\\) is used for triangles, not rectangles."
            },
            {
              "correct": false,
              "value": "formula4",
              "label": "\\(A = \\pi r^2\\)",
              "feedback": {
                "type": "default",
                "value": "Incorrect. This is the formula for a circle's area."
              },
              "rationale": "The formula \\(\\pi r^2\\) calculates the area of a circle, not a rectangle."
            }
          ],
          "prompt": "<p>A rectangular garden has a length of \\(12\\) meters and a width of \\(8\\) meters.</p><p>Which formula should you use to find the area of the garden?</p>",
          "promptEnabled": true,
          "feedbackEnabled": true,
          "rationaleEnabled": true
        },
        "partB": {
          "choiceMode": "checkbox",
          "choicePrefix": "numbers",
          "choices": [
            {
              "correct": false,
              "value": "calc1",
              "label": "The area is \\(20\\) square meters",
              "feedback": {
                "type": "default",
                "value": "Incorrect. Check your calculation."
              },
              "rationale": "This appears to be \\(12 + 8 = 20\\), which is addition not multiplication."
            },
            {
              "correct": true,
              "value": "calc2",
              "label": "The area is \\(96\\) square meters",
              "feedback": {
                "type": "default",
                "value": "Correct! This is the proper area calculation."
              },
              "rationale": "Using \\(A = l \\times w\\), we get \\(A = 12 \\times 8 = 96\\) square meters."
            },
            {
              "correct": true,
              "value": "calc3",
              "label": "If you double the length to \\(24\\) meters, the area becomes \\(192\\) square meters",
              "feedback": {
                "type": "default",
                "value": "Correct! Doubling the length doubles the area."
              },
              "rationale": "With \\(l = 24\\) and \\(w = 8\\), the area is \\(24 \\times 8 = 192\\) square meters, which is exactly double the original area."
            },
            {
              "correct": false,
              "value": "calc4",
              "label": "The perimeter is \\(96\\) meters",
              "feedback": {
                "type": "default",
                "value": "Incorrect. The perimeter is different from the area."
              },
              "rationale": "The perimeter is \\(2(12) + 2(8) = 24 + 16 = 40\\) meters, not \\(96\\)."
            }
          ],
          "prompt": "<p>Using the correct formula from Part 1, select ALL true statements about the garden:</p>",
          "promptEnabled": true,
          "feedbackEnabled": true,
          "rationaleEnabled": true
        }
      },
      "session": {
        "value": {
          "partA": {
            "id": "partA",
            "value": []
          },
          "partB": {
            "id": "partB",
            "value": []
          }
        }
      }
    },
    {
      "id": "physics-motion",
      "title": "Physics: Kinematics and Motion",
      "description": "Two-part problem applying physics equations to real-world motion scenarios",
      "tags": [
        "math",
        "physics",
        "kinematics",
        "equations",
        "problem-solving"
      ],
      "model": {
        "id": "3",
        "element": "ebsr",
        "partLabels": true,
        "partLabelType": "Letters",
        "partA": {
          "choiceMode": "radio",
          "choicePrefix": "letters",
          "choices": [
            {
              "correct": false,
              "value": "eq1",
              "label": "\\(v = \\frac{d}{t}\\)",
              "feedback": {
                "type": "default",
                "value": "Incorrect. This formula doesn't account for acceleration."
              },
              "rationale": "This is the formula for constant velocity, but the problem involves acceleration from rest."
            },
            {
              "correct": true,
              "value": "eq2",
              "label": "\\(d = v_0 t + \\frac{1}{2}at^2\\)",
              "feedback": {
                "type": "default",
                "value": "Correct! This is the kinematic equation for distance with initial velocity and constant acceleration."
              },
              "rationale": "Since the car starts from rest (\\(v_0 = 0\\)), this simplifies to \\(d = \\frac{1}{2}at^2\\), which is the correct formula for this scenario."
            },
            {
              "correct": false,
              "value": "eq3",
              "label": "\\(v_f = v_0 + at\\)",
              "feedback": {
                "type": "default",
                "value": "Incorrect. This finds final velocity, not distance."
              },
              "rationale": "This equation calculates final velocity, but the question asks for distance traveled."
            },
            {
              "correct": false,
              "value": "eq4",
              "label": "\\(v_f^2 = v_0^2 + 2ad\\)",
              "feedback": {
                "type": "default",
                "value": "Incorrect. While this relates to the problem, it's not the most direct formula for finding distance given time."
              },
              "rationale": "This equation could work but requires solving for \\(d\\), and we don't have \\(v_f\\) directly."
            }
          ],
          "prompt": "<p>A car starts from rest and accelerates uniformly at \\(2 \\text{ m/s}^2\\) for \\(10\\) seconds.</p><p>Which equation should you use to calculate the distance traveled?</p>",
          "promptEnabled": true,
          "feedbackEnabled": true,
          "rationaleEnabled": true,
          "teacherInstructions": "<p>Students should recognize this as a uniformly accelerated motion problem starting from rest.</p>",
          "teacherInstructionsEnabled": true
        },
        "partB": {
          "choiceMode": "checkbox",
          "choicePrefix": "letters",
          "choices": [
            {
              "correct": true,
              "value": "res1",
              "label": "The car travels \\(100\\) meters",
              "feedback": {
                "type": "default",
                "value": "Correct! This is the distance traveled."
              },
              "rationale": "Using \\(d = \\frac{1}{2}at^2 = \\frac{1}{2}(2)(10)^2 = \\frac{1}{2}(2)(100) = 100\\) meters."
            },
            {
              "correct": false,
              "value": "res2",
              "label": "The car travels \\(20\\) meters",
              "feedback": {
                "type": "default",
                "value": "Incorrect. Check your calculation with the formula."
              },
              "rationale": "This would be \\(2 \\times 10 = 20\\), but that's not how the formula works."
            },
            {
              "correct": true,
              "value": "res3",
              "label": "The car's final velocity is \\(20 \\text{ m/s}\\)",
              "feedback": {
                "type": "default",
                "value": "Correct! This follows from the acceleration."
              },
              "rationale": "Using \\(v_f = v_0 + at = 0 + (2)(10) = 20\\) m/s."
            },
            {
              "correct": false,
              "value": "res4",
              "label": "If the acceleration doubled to \\(4 \\text{ m/s}^2\\), the distance would be \\(150\\) meters",
              "feedback": {
                "type": "default",
                "value": "Incorrect. Doubling acceleration more than doubles the distance relationship."
              },
              "rationale": "With \\(a = 4\\), the distance would be \\(d = \\frac{1}{2}(4)(10)^2 = 200\\) meters, not \\(150\\)."
            },
            {
              "correct": true,
              "value": "res5",
              "label": "The average velocity during this time is \\(10 \\text{ m/s}\\)",
              "feedback": {
                "type": "default",
                "value": "Correct! Average velocity is half the final velocity when starting from rest."
              },
              "rationale": "For uniform acceleration from rest, \\(v_{avg} = \\frac{v_0 + v_f}{2} = \\frac{0 + 20}{2} = 10\\) m/s. We can also verify: \\(d = v_{avg} \\times t = 10 \\times 10 = 100\\) meters."
            }
          ],
          "prompt": "<p>Based on the equation from Part A and the given values, select ALL true statements:</p>",
          "promptEnabled": true,
          "feedbackEnabled": true,
          "rationaleEnabled": true,
          "teacherInstructions": "<p>Students must apply the formula and understand relationships between distance, velocity, and acceleration.</p>",
          "teacherInstructionsEnabled": true
        }
      },
      "session": {
        "value": {
          "partA": {
            "id": "partA",
            "value": []
          },
          "partB": {
            "id": "partB",
            "value": []
          }
        }
      }
    }
  ]
};
