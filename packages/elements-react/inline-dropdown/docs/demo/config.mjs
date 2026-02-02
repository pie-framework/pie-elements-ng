export default {
  demos: [
    {
      id: 'basic-sentence',
      title: 'Basic Sentence Completion',
      description: 'Simple dropdown usage with a familiar nursery rhyme',
      tags: ['basic', 'sentence-completion', 'beginner'],
      model: {
        id: '1',
        element: 'inline-dropdown',
        disabled: false,
        mode: 'gather',
        prompt: '<p>Complete the famous nursery rhyme using the dropdowns below.</p>',
        promptEnabled: true,
        toolbarEditorPosition: 'bottom',
        shuffle: true,
        markup: '<div><p>The {{0}} jumped {{1}} the {{2}}.</p></div>',
        choices: {
          '0': [
            {
              label: 'cow',
              value: '0',
              correct: true,
              rationale: 'Correct! "The cow jumped over the moon" is from the nursery rhyme "Hey Diddle Diddle".'
            },
            {
              label: 'dog',
              value: '1',
              correct: false,
              rationale: 'Incorrect. The cow, not the dog, jumped over the moon in the nursery rhyme.'
            },
            {
              label: 'cat',
              value: '2',
              correct: false,
              rationale: 'Incorrect. While a cat plays the fiddle in the rhyme, it\'s the cow that jumps.'
            }
          ],
          '1': [
            {
              label: 'over',
              value: '0',
              correct: true,
              rationale: 'Correct! The cow jumped over the moon.'
            },
            {
              label: 'under',
              value: '1',
              correct: false,
              rationale: 'Incorrect. The cow jumped over, not under, the moon.'
            },
            {
              label: 'around',
              value: '2',
              correct: false,
              rationale: 'Incorrect. The cow jumped over the moon, not around it.'
            }
          ],
          '2': [
            {
              label: 'moon',
              value: '0',
              correct: true,
              rationale: 'Correct! The famous line is "the cow jumped over the moon".'
            },
            {
              label: 'sun',
              value: '1',
              correct: false,
              rationale: 'Incorrect. The nursery rhyme mentions the moon, not the sun.'
            },
            {
              label: 'fence',
              value: '2',
              correct: false,
              rationale: 'Incorrect. The cow jumped over the moon in the nursery rhyme.'
            }
          ]
        },
        alternateResponse: {},
        choiceRationaleEnabled: true,
        rationaleEnabled: true,
        rationale: '<p>This question tests knowledge of the classic nursery rhyme "Hey Diddle Diddle".</p>',
        teacherInstructions: '<p>This is a simple introduction to inline dropdown questions using familiar content.</p>',
        teacherInstructionsEnabled: true,
        rubricEnabled: false
      },
      session: {
        id: '1',
        element: 'inline-dropdown'
      }
    },
    {
      id: 'math-algebra',
      title: 'Math Equation Completion',
      description: 'Algebra question with math notation in markup and choices',
      tags: ['math', 'algebra', 'latex', 'intermediate'],
      model: {
        id: '2',
        element: 'inline-dropdown',
        disabled: false,
        mode: 'gather',
        prompt: '<p>Complete the quadratic formula by selecting the correct terms.</p>',
        promptEnabled: true,
        toolbarEditorPosition: 'bottom',
        shuffle: true,
        markup: '<div><p>For a quadratic equation \\(ax^2 + bx + c = 0\\), the solutions are given by:</p><p>\\(x = \\frac{-b \\pm \\sqrt{{{0}}}}{{{1}}}\\)</p></div>',
        choices: {
          '0': [
            {
              label: '\\(b^2 - 4ac\\)',
              value: '0',
              correct: true,
              rationale: 'Correct! The discriminant \\(b^2 - 4ac\\) goes under the square root in the quadratic formula.'
            },
            {
              label: '\\(b^2 + 4ac\\)',
              value: '1',
              correct: false,
              rationale: 'Incorrect. The discriminant is \\(b^2 - 4ac\\), not \\(b^2 + 4ac\\).'
            },
            {
              label: '\\(b^2 - 2ac\\)',
              value: '2',
              correct: false,
              rationale: 'Incorrect. The coefficient should be 4, not 2. The discriminant is \\(b^2 - 4ac\\).'
            },
            {
              label: '\\(a^2 - 4bc\\)',
              value: '3',
              correct: false,
              rationale: 'Incorrect. The discriminant involves \\(b^2\\), not \\(a^2\\).'
            }
          ],
          '1': [
            {
              label: '\\(2a\\)',
              value: '0',
              correct: true,
              rationale: 'Correct! The denominator in the quadratic formula is \\(2a\\).'
            },
            {
              label: '\\(a\\)',
              value: '1',
              correct: false,
              rationale: 'Incorrect. The denominator is \\(2a\\), not just \\(a\\).'
            },
            {
              label: '\\(2b\\)',
              value: '2',
              correct: false,
              rationale: 'Incorrect. The denominator involves the coefficient \\(a\\), not \\(b\\).'
            },
            {
              label: '\\(b\\)',
              value: '3',
              correct: false,
              rationale: 'Incorrect. The denominator is \\(2a\\), not \\(b\\).'
            }
          ]
        },
        alternateResponse: {},
        choiceRationaleEnabled: true,
        rationaleEnabled: true,
        rationale: '<p>The quadratic formula is one of the most important formulas in algebra. It provides a method to solve any quadratic equation of the form \\(ax^2 + bx + c = 0\\).</p>',
        teacherInstructions: '<p>Ensure students understand the structure of the quadratic formula and can identify each component correctly.</p>',
        teacherInstructionsEnabled: true,
        rubricEnabled: false
      },
      session: {
        id: '2',
        element: 'inline-dropdown'
      }
    },
    {
      id: 'multiple-dropdowns-science',
      title: 'Multiple Dropdowns - Scientific Process',
      description: 'Complex question with multiple dropdowns testing understanding of the scientific method',
      tags: ['multiple-dropdowns', 'science', 'intermediate', 'complex'],
      model: {
        id: '3',
        element: 'inline-dropdown',
        disabled: false,
        mode: 'gather',
        prompt: '<p><strong>Scientific Method:</strong> Complete the passage about conducting a scientific experiment.</p>',
        promptEnabled: true,
        toolbarEditorPosition: 'bottom',
        shuffle: true,
        markup: '<div><p>A scientist begins by making an {{0}} about a phenomenon. Based on background research, they formulate a {{1}}, which is a testable prediction. They then design and conduct an {{2}} to test this prediction. After collecting data, they {{3}} the results to determine if the hypothesis was supported. Finally, they {{4}} their findings to the scientific community.</p></div>',
        choices: {
          '0': [
            {
              label: 'observation',
              value: '0',
              correct: true,
              rationale: 'Correct! The scientific method begins with making an observation about something in nature.'
            },
            {
              label: 'experiment',
              value: '1',
              correct: false,
              rationale: 'Incorrect. The experiment comes later in the process, after forming a hypothesis.'
            },
            {
              label: 'conclusion',
              value: '2',
              correct: false,
              rationale: 'Incorrect. A conclusion is drawn at the end of the process, not at the beginning.'
            }
          ],
          '1': [
            {
              label: 'hypothesis',
              value: '0',
              correct: true,
              rationale: 'Correct! A hypothesis is a testable prediction based on observations and research.'
            },
            {
              label: 'theory',
              value: '1',
              correct: false,
              rationale: 'Incorrect. A theory is a well-established explanation, not a testable prediction for a single experiment.'
            },
            {
              label: 'law',
              value: '2',
              correct: false,
              rationale: 'Incorrect. A scientific law describes what happens, not a prediction to be tested.'
            }
          ],
          '2': [
            {
              label: 'experiment',
              value: '0',
              correct: true,
              rationale: 'Correct! An experiment is conducted to test the hypothesis.'
            },
            {
              label: 'conclusion',
              value: '1',
              correct: false,
              rationale: 'Incorrect. A conclusion comes after analyzing the data, not before.'
            },
            {
              label: 'observation',
              value: '2',
              correct: false,
              rationale: 'Incorrect. While observations are important, the term here refers to conducting a controlled test.'
            }
          ],
          '3': [
            {
              label: 'analyze',
              value: '0',
              correct: true,
              rationale: 'Correct! Scientists analyze the data collected during the experiment.'
            },
            {
              label: 'ignore',
              value: '1',
              correct: false,
              rationale: 'Incorrect. Scientists carefully analyze all data, they don\'t ignore results.'
            },
            {
              label: 'guess',
              value: '2',
              correct: false,
              rationale: 'Incorrect. Analysis is systematic, not based on guessing.'
            }
          ],
          '4': [
            {
              label: 'communicate',
              value: '0',
              correct: true,
              rationale: 'Correct! Scientists communicate their findings through papers, presentations, and publications.'
            },
            {
              label: 'hide',
              value: '1',
              correct: false,
              rationale: 'Incorrect. Science advances through sharing findings, not hiding them.'
            },
            {
              label: 'forget',
              value: '2',
              correct: false,
              rationale: 'Incorrect. Scientific findings are documented and shared, not forgotten.'
            }
          ]
        },
        alternateResponse: {},
        choiceRationaleEnabled: true,
        rationaleEnabled: true,
        rationale: '<p>The scientific method is a systematic approach to investigating phenomena, acquiring new knowledge, and correcting previous understanding. Each step builds upon the previous one to ensure reliable and reproducible results.</p>',
        teacherInstructions: '<p>This question assesses understanding of the sequential nature of the scientific method and the purpose of each step. Students should understand that science is a process, not just memorizing facts.</p>',
        teacherInstructionsEnabled: true,
        rubricEnabled: false
      },
      session: {
        id: '3',
        element: 'inline-dropdown'
      }
    },
    {
      id: 'advanced-biology',
      title: 'Advanced Cellular Biology',
      description: 'Challenging question with technical vocabulary and multiple dropdowns',
      tags: ['advanced', 'biology', 'technical', 'multiple-dropdowns'],
      model: {
        id: '4',
        element: 'inline-dropdown',
        disabled: false,
        mode: 'gather',
        prompt: '<p><strong>Advanced Biology:</strong> Complete the passage about cellular respiration and energy production.</p>',
        promptEnabled: true,
        toolbarEditorPosition: 'bottom',
        shuffle: true,
        markup: '<div><p>Cellular respiration begins with {{0}}, which occurs in the cytoplasm and breaks down glucose into pyruvate. The pyruvate then enters the {{1}}, where the {{2}} takes place, producing electron carriers. These electrons are then passed through the {{3}}, which is located in the inner mitochondrial membrane. The final result is the production of approximately {{4}} molecules of ATP per glucose molecule.</p></div>',
        choices: {
          '0': [
            {
              label: 'glycolysis',
              value: '0',
              correct: true,
              rationale: 'Correct! Glycolysis is the first stage of cellular respiration and occurs in the cytoplasm.'
            },
            {
              label: 'photosynthesis',
              value: '1',
              correct: false,
              rationale: 'Incorrect. Photosynthesis produces glucose; it does not break it down for energy.'
            },
            {
              label: 'fermentation',
              value: '2',
              correct: false,
              rationale: 'Incorrect. Fermentation is an anaerobic process that occurs when oxygen is not available.'
            },
            {
              label: 'transcription',
              value: '3',
              correct: false,
              rationale: 'Incorrect. Transcription is part of protein synthesis, not cellular respiration.'
            }
          ],
          '1': [
            {
              label: 'mitochondria',
              value: '0',
              correct: true,
              rationale: 'Correct! The mitochondria are the organelles where the Krebs cycle and electron transport chain occur.'
            },
            {
              label: 'chloroplast',
              value: '1',
              correct: false,
              rationale: 'Incorrect. Chloroplasts are for photosynthesis in plant cells, not cellular respiration.'
            },
            {
              label: 'nucleus',
              value: '2',
              correct: false,
              rationale: 'Incorrect. The nucleus contains DNA but is not where cellular respiration occurs.'
            },
            {
              label: 'ribosome',
              value: '3',
              correct: false,
              rationale: 'Incorrect. Ribosomes are responsible for protein synthesis, not energy production.'
            }
          ],
          '2': [
            {
              label: 'Krebs cycle',
              value: '0',
              correct: true,
              rationale: 'Correct! The Krebs cycle (also called the citric acid cycle) occurs in the mitochondrial matrix.'
            },
            {
              label: 'Calvin cycle',
              value: '1',
              correct: false,
              rationale: 'Incorrect. The Calvin cycle is part of photosynthesis, not cellular respiration.'
            },
            {
              label: 'light reactions',
              value: '2',
              correct: false,
              rationale: 'Incorrect. Light reactions are part of photosynthesis, not cellular respiration.'
            },
            {
              label: 'glycolysis',
              value: '3',
              correct: false,
              rationale: 'Incorrect. Glycolysis occurs in the cytoplasm before pyruvate enters the mitochondria.'
            }
          ],
          '3': [
            {
              label: 'electron transport chain',
              value: '0',
              correct: true,
              rationale: 'Correct! The electron transport chain is the final stage where most ATP is produced.'
            },
            {
              label: 'ATP synthase',
              value: '1',
              correct: false,
              rationale: 'Partially correct. ATP synthase is part of the process but "electron transport chain" is the complete answer.'
            },
            {
              label: 'ribosome',
              value: '2',
              correct: false,
              rationale: 'Incorrect. Ribosomes synthesize proteins, they are not involved in the electron transport process.'
            },
            {
              label: 'DNA helicase',
              value: '3',
              correct: false,
              rationale: 'Incorrect. DNA helicase is involved in DNA replication, not cellular respiration.'
            }
          ],
          '4': [
            {
              label: '36-38',
              value: '0',
              correct: true,
              rationale: 'Correct! Complete aerobic respiration produces approximately 36-38 ATP molecules per glucose.'
            },
            {
              label: '2-4',
              value: '1',
              correct: false,
              rationale: 'Incorrect. This is closer to the ATP yield from glycolysis alone, not complete cellular respiration.'
            },
            {
              label: '100-120',
              value: '2',
              correct: false,
              rationale: 'Incorrect. This is far too high. Cellular respiration produces about 36-38 ATP per glucose.'
            },
            {
              label: '12-15',
              value: '3',
              correct: false,
              rationale: 'Incorrect. This underestimates the efficiency of cellular respiration.'
            }
          ]
        },
        alternateResponse: {},
        choiceRationaleEnabled: true,
        rationaleEnabled: true,
        rationale: '<p>Cellular respiration is a complex metabolic pathway that efficiently extracts energy from glucose. Understanding the location and function of each stage is crucial for comprehending how cells produce ATP, the energy currency of life.</p>',
        teacherInstructions: '<p>This advanced question requires students to understand the complete process of cellular respiration, including where each stage occurs and approximately how much energy is produced. Ensure students can differentiate between respiration and photosynthesis.</p>',
        teacherInstructionsEnabled: true,
        rubricEnabled: false
      },
      session: {
        id: '4',
        element: 'inline-dropdown'
      }
    }
  ]
};