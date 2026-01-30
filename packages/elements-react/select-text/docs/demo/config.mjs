export default {
  "models": [
    {
      "id": "1",
      "element": "select-text",
      "feedback": {
        "correct": {
          "type": "default",
          "default": "Correct"
        },
        "incorrect": {
          "type": "default",
          "default": "Incorrect"
        },
        "partial": {
          "type": "default",
          "default": "Nearly"
        }
      },
      "partialScoring": true,
      "maxSelections": 2,
      "mode": "sentence",
      "rationale": "<p>The final sentence of the passage best exemplifies the theme of the short story because Natasha&#39;s practice and determination finally pays off.</p>",
      "prompt": "<p>Select the sentence from&#160;&#34;The Gymnast&#34; that <span class=\"relative-emphasis\">best</span> represents the theme.</p>",
      "promptEnabled": true,
      "toolbarEditorPosition": "bottom",
      "text": "<p>She thought about what she had to do, struggling to rein in her wild, fearful thoughts. Coach Cummings always said that an undisciplined mind never scored a perfect 10. Natasha wanted to please her Coach, yet sometimes his approval wasn't as exciting as his anger. The gymnasts were unanimous about one thing: Coach Cummings's fits of disapproving rage were much more humorous to witness than his infrequent, backslapping moments of high praise. Just for a hair of a moment, Natasha wondered if she really wanted a perfect 10, so weary was she of trying for but never achieving one.</p>\n\n<p>At last Natasha's moment arrived. The faces of past giants of gymnastics swam before her mind's eye, now razor&#8211;sharp with fierce determination. \"I am talented. I am not afraid. I will make a perfect 10,\" she spoke aloud to herself, as she approached the mat, dusted her hands with chalk to prevent slippage, and returned to her starting point. Suddenly, the din of the gymnasium was silent to her. Forcing all sound out of her mind, she focused on the gleaming balance beam ahead of her. Taking a deep breath, Natasha made her graceful, yet powerful approach, mounted the beam flawlessly, and...executed her first perfect 10.</p>\n",
      "tokens": [
        {
          "text": "She thought about what she had to do, struggling to rein in her wild, fearful thoughts.",
          "end": 90,
          "start": 3,
          "correct": false
        },
        {
          "start": 449,
          "end": 585,
          "text": "Just for a hair of a moment, Natasha wondered if she really wanted a perfect 10, so weary was she of trying for but never achieving one.",
          "correct": false
        },
        {
          "end": 627,
          "correct": false,
          "text": "At last Natasha's moment arrived.",
          "start": 594
        },
        {
          "end": 743,
          "text": "The faces of past giants of gymnastics swam before her mind's eye, now razor&#8211;sharp with fierce determination.",
          "correct": false,
          "start": 628
        },
        {
          "text": "Suddenly, the din of the gymnasium was silent to her.",
          "end": 997,
          "correct": false,
          "start": 944
        },
        {
          "end": 1087,
          "start": 998,
          "correct": false,
          "text": "Forcing all sound out of her mind, she focused on the gleaming balance beam ahead of her."
        },
        {
          "correct": true,
          "start": 1088,
          "end": 1225,
          "text": "Taking a deep breath, Natasha made her graceful, yet powerful approach, mounted the beam flawlessly, and...executed her first perfect 10."
        }
      ],
      "teacherInstructions": "",
      "rubricEnabled": false
    }
  ]
}
;
