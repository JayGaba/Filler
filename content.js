chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "fillForm") {
      const result = fillFormWithUserData();
      sendResponse({success: true, message: "Form fill initiated"});
    }
    return true;
  });
  
  function fillFormWithUserData() {
    chrome.storage.sync.get([
      'name',
      'registration',
      'phone',
      'email',
      'resume'
    ], function(userData) {
      if (Object.keys(userData).length === 0) {
        alert("No saved data found. Please save your details first!");
        return;
      }
      
      const fieldMapping = {
        name: ["name", "full name", "your name"],
        registration: ["registration number", "reg number", "reg no", "registration", "registration no"],
        phone: ["phone", "contact", "mobile", "phone number", "contact number", "mobile number"],
        email: ["email", "mail", "email id", "mail id", "e-mail", "e-mail id"],
        resume: ["resume", "cv", "resume link", "cv link"]
      };
      
      let formFields = document.querySelectorAll('div.geS5n');
      if (formFields.length === 0) {
        formFields = document.querySelectorAll('div.freebirdFormviewerComponentsQuestionBaseRoot');
      }
      if (formFields.length === 0) {
        formFields = Array.from(document.querySelectorAll('div[role="heading"]')).map(heading => {
          return heading.closest('div.freebirdFormviewerViewItemsItemItem') || 
                 heading.closest('div[role="listitem"]') || 
                 heading.parentElement.parentElement.parentElement;
        });
      }
      
      let filledCount = 0;
      
      formFields.forEach(field => {
        try {
          let headingElement = field.querySelector('div[role="heading"]') || field.querySelector('[role="heading"]');
          if (headingElement) {
            const labelText = headingElement.textContent.trim().toLowerCase();
            let inputElement = field.querySelector('input.whsOnd') || field.querySelector('input[type="text"]');
            if (!inputElement) {
              const inputs = field.querySelectorAll('input');
              if (inputs.length > 0) {
                inputElement = inputs[0];
              }
            }
            if (inputElement && labelText) {
              for (const [fieldType, possibleLabels] of Object.entries(fieldMapping)) {
                if (possibleLabels.some(label => labelText.includes(label))) {
                  if (userData[fieldType]) {
                    fillInputField(inputElement, userData[fieldType]);
                    filledCount++;
                    break;
                  }
                }
              }
            }
          }
        } catch (error) {}
      });
      
      if (filledCount > 0) {
        showNotification(`Successfully filled ${filledCount} form fields.`);
      } else {
        showNotification("No matching fields found in this form.", "warning");
      }
    });
  }
  
  function fillInputField(input, value) {
    try {
      input.value = value;
      const events = ['input', 'change', 'focus', 'blur'];
      events.forEach(eventType => {
        const event = new Event(eventType, { bubbles: true });
        input.dispatchEvent(event);
      });
      if (Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set) {
        const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        const prototype = Object.getPrototypeOf(input);
        const valueProp = Object.getOwnPropertyDescriptor(prototype, 'value');
        if (valueProp && valueProp.set) {
          valueProp.set.call(input, value);
        } else if (valueSetter) {
          valueSetter.call(input, value);
        }
      }
      const originalBg = input.style.backgroundColor;
      input.style.backgroundColor = '#e6f4ea';
      setTimeout(() => {
        input.style.backgroundColor = originalBg;
      }, 1000);
    } catch (error) {}
  }
  
  function showNotification(message, type = "success") {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '10px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.fontSize = '14px';
    notification.style.zIndex = '9999';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    if (type === "success") {
      notification.style.backgroundColor = '#e6f4ea';
      notification.style.color = '#137333';
      notification.style.border = '1px solid #ceead6';
    } else if (type === "warning") {
      notification.style.backgroundColor = '#fef7e0';
      notification.style.color = '#9a5700';
      notification.style.border = '1px solid #fdd663';
    }
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }
  
  document.addEventListener('keydown', function(e) {
    if (e.altKey && e.shiftKey && e.code === 'KeyF') {
      fillFormWithUserData();
    }
  });
  
  setTimeout(() => {}, 1000);