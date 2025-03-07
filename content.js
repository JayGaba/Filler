chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "fillForm") {
    const result = fillFormWithUserData();
    sendResponse({ success: true, message: "Form fill initiated" });
  }
  return true;
});

function fillFormWithUserData() {
  chrome.storage.sync.get(
    [
      "name",
      "registration",
      "phone",
      "srmEmail",
      "personalEmail",
      "resume",
      "dob",
      "specialization",
      "department",
      "gender",
    ],
    function (userData) {
      if (Object.keys(userData).length === 0) {
        alert("No saved data found. Please save your details first!");
        return;
      }

      const fieldMapping = {
        name: ["name", "full name", "your name"],
        registration: [
          "registration number",
          "reg number",
          "reg no",
          "registration",
          "registration no",
        ],
        phone: [
          "phone",
          "contact",
          "mobile",
          "phone number",
          "contact number",
          "mobile number",
        ],
        srmEmail: [
          "srm mail",
          "srm email",
          "college mail",
          "college email",
          "institutional email",
          "institutional mail",
        ],
        personalEmail: [
          "personal mail",
          "personal email",
          "gmail",
          "gmail id",
          "google mail",
        ],
        resume: ["resume", "cv", "resume link", "cv link"],
        dob: ["dob", "date of birth", "birth date", "birthdate"],
        specialization: [
          "specialization",
          "specialisation",
          "major",
          "stream",
          "SPECIALISATION",
        ],
        department: ["department", "dept", "faculty", "branch"],
        gender: ["gender", "sex"],
      };

      let formFields = document.querySelectorAll("div.geS5n");
      if (formFields.length === 0) {
        formFields = document.querySelectorAll(
          "div.freebirdFormviewerComponentsQuestionBaseRoot"
        );
      }
      if (formFields.length === 0) {
        formFields = Array.from(
          document.querySelectorAll('div[role="heading"]')
        ).map((heading) => {
          return (
            heading.closest("div.freebirdFormviewerViewItemsItemItem") ||
            heading.closest('div[role="listitem"]') ||
            heading.parentElement.parentElement.parentElement
          );
        });
      }

      let filledCount = 0;

      formFields.forEach((field) => {
        try {
          let headingElement =
            field.querySelector('div[role="heading"]') ||
            field.querySelector('[role="heading"]');
          if (headingElement) {
            const labelText = headingElement.textContent.trim().toLowerCase();

            if (labelText.includes("mail") || labelText.includes("email")) {
              if (
                labelText.includes("srm") ||
                labelText.includes("college") ||
                labelText.includes("institutional")
              ) {
                const inputElement = findInputElement(field);
                if (inputElement && userData.srmEmail) {
                  fillInputField(inputElement, userData.srmEmail);
                  filledCount++;
                  return;
                }
              } else if (
                labelText.includes("personal") ||
                labelText.includes("gmail") ||
                labelText.includes("google")
              ) {
                const inputElement = findInputElement(field);
                if (inputElement && userData.personalEmail) {
                  fillInputField(inputElement, userData.personalEmail);
                  filledCount++;
                  return;
                }
              } else {
                const inputElement = findInputElement(field);
                if (inputElement) {
                  if (userData.srmEmail) {
                    fillInputField(inputElement, userData.srmEmail);
                    filledCount++;
                  } else if (userData.personalEmail) {
                    fillInputField(inputElement, userData.personalEmail);
                    filledCount++;
                  }
                  return;
                }
              }
            }

            if (
              labelText.includes("date of birth") ||
              labelText.includes("dob") ||
              labelText.includes("birth date")
            ) {
              if (userData.dob) {
                const dateInput = field.querySelector('input[type="date"]');
                if (dateInput) {
                  fillInputField(dateInput, userData.dob);
                  filledCount++;
                  return;
                }

                const dropdowns = field.querySelectorAll("select");
                if (dropdowns.length >= 3) {
                  const dobDate = new Date(userData.dob);

                  const month = dobDate.getMonth() + 1;
                  const day = dobDate.getDate();
                  const year = dobDate.getFullYear();

                  let monthSet = false,
                    daySet = false,
                    yearSet = false;

                  dropdowns.forEach((dropdown) => {
                    const selectLabel =
                      dropdown.getAttribute("aria-label") || "";
                    const options = Array.from(dropdown.options).map((opt) =>
                      opt.text.toLowerCase()
                    );

                    if (
                      (selectLabel.toLowerCase().includes("month") ||
                        options.some(
                          (opt) =>
                            opt.includes("january") || opt.includes("february")
                        )) &&
                      !monthSet
                    ) {
                      setSelectValue(dropdown, month.toString());
                      monthSet = true;
                    } else if (
                      (selectLabel.toLowerCase().includes("day") ||
                        (options.length > 28 &&
                          options.every((opt) => !isNaN(opt.trim())))) &&
                      !daySet
                    ) {
                      setSelectValue(dropdown, day.toString());
                      daySet = true;
                    } else if (
                      (selectLabel.toLowerCase().includes("year") ||
                        options.some(
                          (opt) => opt.length === 4 && !isNaN(opt.trim())
                        )) &&
                      !yearSet
                    ) {
                      setSelectValue(dropdown, year.toString());
                      yearSet = true;
                    }
                  });

                  if (monthSet || daySet || yearSet) {
                    filledCount++;
                    return;
                  }
                }
              }
            }

            if (
              (labelText.includes("specialization") ||
                labelText.includes("specialize") ||
                labelText.includes("major") ||
                labelText.includes("stream")) &&
              userData.specialization
            ) {
              const success = handleMultipleChoice(
                field,
                userData.specialization
              );
              if (success) {
                filledCount++;
                return;
              }
            }

            if (
              (labelText.includes("department") ||
                labelText.includes("dept") ||
                labelText.includes("branch")) &&
              userData.department
            ) {
              const success = handleMultipleChoice(field, userData.department);
              if (success) {
                filledCount++;
                return;
              }
            }

            if (
              (labelText.includes("gender") || labelText.includes("sex")) &&
              userData.gender
            ) {
              const success = handleMultipleChoice(field, userData.gender);
              if (success) {
                filledCount++;
                return;
              }
            }

            const inputElement = findInputElement(field);
            if (inputElement && labelText) {
              for (const [fieldType, possibleLabels] of Object.entries(
                fieldMapping
              )) {
                if (possibleLabels.some((label) => labelText.includes(label))) {
                  if (userData[fieldType]) {
                    fillInputField(inputElement, userData[fieldType]);
                    filledCount++;
                    break;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Error processing field:", error);
        }
      });

      if (filledCount > 0) {
        showNotification(`Successfully filled ${filledCount} form fields.`);
      } else {
        showNotification("No matching fields found in this form.", "warning");
      }
    }
  );
}

function findInputElement(field) {
  let input =
    field.querySelector("input.whsOnd") ||
    field.querySelector('input[type="text"]') ||
    field.querySelector('input[type="email"]') ||
    field.querySelector('input[type="date"]');

  if (!input) {
    const inputs = field.querySelectorAll("input");
    if (inputs.length > 0) {
      input = inputs[0];
    }
  }

  return input;
}

function handleMultipleChoice(field, userValue) {
  const radioButtons = field.querySelectorAll('div[role="radio"]');

  if (radioButtons.length > 0) {
    const userValueLower = userValue.toLowerCase().trim();

    const radioLabels = field.querySelectorAll(
      ".docssharedWizToggleLabeledContainer .aDTYNe"
    );

    const radioOptions = [];
    for (let i = 0; i < radioLabels.length; i++) {
      if (i < radioButtons.length) {
        radioOptions.push({
          radio: radioButtons[i],
          label: radioLabels[i].textContent.toLowerCase().trim(),
        });
      }
    }

    let match = radioOptions.find((option) => option.label === userValueLower);

    if (!match) {
      match = radioOptions.find(
        (option) =>
          option.label.includes(userValueLower) ||
          userValueLower.includes(option.label)
      );
    }

    if (match) {
      clickGoogleFormsRadio(match.radio);
      return true;
    }
  }

  const dropdown = field.querySelector("select");
  if (dropdown) {
    return setSelectValue(dropdown, userValue);
  }

  return false;
}

function clickGoogleFormsRadio(radioDiv) {
  radioDiv.click();

  radioDiv.setAttribute("aria-checked", "true");

  const events = ["click", "change", "mousedown", "mouseup"];
  events.forEach((eventType) => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    radioDiv.dispatchEvent(event);
  });

  radioDiv.style.outline = "2px solid #1a73e8";
  setTimeout(() => {
    radioDiv.style.outline = "";
  }, 1000);
}

function setSelectValue(select, value) {
  if (!select || !value) return false;

  const valueLower = value.toLowerCase().trim();
  let optionFound = false;

  for (const option of select.options) {
    if (option.text.toLowerCase().trim() === valueLower) {
      select.value = option.value;
      optionFound = true;
      break;
    }
  }

  if (!optionFound) {
    for (const option of select.options) {
      if (
        option.text.toLowerCase().trim().includes(valueLower) ||
        valueLower.includes(option.text.toLowerCase().trim())
      ) {
        select.value = option.value;
        optionFound = true;
        break;
      }
    }
  }

  if (optionFound) {
    const events = ["change", "input"];
    events.forEach((eventType) => {
      const event = new Event(eventType, { bubbles: true });
      select.dispatchEvent(event);
    });

    const originalBg = select.style.backgroundColor;
    select.style.backgroundColor = "#e6f4ea";
    setTimeout(() => {
      select.style.backgroundColor = originalBg;
    }, 1000);

    return true;
  }

  return false;
}

function fillInputField(input, value) {
  try {
    input.value = value;
    const events = ["input", "change", "focus", "blur"];
    events.forEach((eventType) => {
      const event = new Event(eventType, { bubbles: true });
      input.dispatchEvent(event);
    });
    if (
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set
    ) {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set;
      const prototype = Object.getPrototypeOf(input);
      const valueProp = Object.getOwnPropertyDescriptor(prototype, "value");
      if (valueProp && valueProp.set) {
        valueProp.set.call(input, value);
      } else if (valueSetter) {
        valueSetter.call(input, value);
      }
    }
    const originalBg = input.style.backgroundColor;
    input.style.backgroundColor = "#e6f4ea";
    setTimeout(() => {
      input.style.backgroundColor = originalBg;
    }, 1000);
  } catch (error) {
    console.error("Error filling input field:", error);
  }
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.style.position = "fixed";
  notification.style.top = "10px";
  notification.style.left = "50%";
  notification.style.transform = "translateX(-50%)";
  notification.style.padding = "10px 20px";
  notification.style.borderRadius = "4px";
  notification.style.fontSize = "14px";
  notification.style.zIndex = "9999";
  notification.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  if (type === "success") {
    notification.style.backgroundColor = "#e6f4ea";
    notification.style.color = "#137333";
    notification.style.border = "1px solid #ceead6";
  } else if (type === "warning") {
    notification.style.backgroundColor = "#fef7e0";
    notification.style.color = "#9a5700";
    notification.style.border = "1px solid #fdd663";
  }
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.5s";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
}

document.addEventListener("keydown", function (e) {
  if (e.altKey && e.shiftKey && e.code === "KeyF") {
    fillFormWithUserData();
  }
});
