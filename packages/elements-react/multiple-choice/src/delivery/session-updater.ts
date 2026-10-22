// @ts-nocheck

export function updateSessionValue(session, choiceMode, data) {
  session.value = session.value || [];
  if (choiceMode === 'checkbox') {
    if (data.selected) {
      session.value = Array.from(new Set([...session.value, data.value]));
    } else {
      session.value = session.value.filter(v => v !== data.value);
    }
  }

  if (choiceMode === 'radio') {
    if (data.selected) {
      session.value = [data.value];
    } else {
      session.value = [];
    }
  }
  
  //update session value metadata
  session.selector = data.selector; //the input method used to select the choice (e.g. mouse, keyboard)
}
