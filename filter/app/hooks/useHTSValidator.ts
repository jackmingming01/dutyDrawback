
"use client";
import { useState, useCallback } from 'react';

/**
 * Custom React hook to validate, add, edit, and track HTS codes.
 */
export const useHTSValidator = () => {
  /**
   * Type representing the structure of validation results.
   */
  type ValidationResult = {
    validCodes: string[];
    invalidCodes: string[]; // Codes with invalid formats
    duplicateCodes: string[]; // Duplicated codes within input or against existing codes
  };

  /**
   * Type representing the result of editing HTS codes.
   */
  type EditHTSCodeResult = {
    successfulEdits: { oldCode: string; newCodes: string[] }[];
    failedEdits: { oldCode: string; newCodes: string[]; error: string }[];
  };

  /**
   * Type representing the return structure of the useHTSValidator hook.
   */
  type UseHTSValidatorReturn = {
    validateHTSCode: (code: string) => void;
    validateHTSCodes: (
      codes: string,
      afterValidation?: (result: ValidationResult, errorMsg: string | null) => void
    ) => void;
    editHTSCode: (
      oldHTSCodes: string,
      newHTSCodes: string,
      callback: (error: string | null, resultEditedCodes: EditHTSCodeResult | null) => void
    ) => void;
    validateHTSCodeRealTime: (
      codes: string,
      callback: (result: ValidationResult, error: string | null) => void
    ) => void;
    autoFormatHTSCodes: (codes: string) => string;
    resetValidation: () => void;
    clearAllCodes: () => void;
    validationResult: ValidationResult | null;
    errorMessage: string | null;
  };

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allAddedCodes, setAllAddedCodes] = useState<Set<string>>(new Set());

  /**
   * Normalizes an HTS code by trimming whitespace and converting to uppercase,
   * except for the '%d' wildcard which remains lowercase.
   * Ensures consistency in storage and comparison.
   *
   * @param code The HTS code to normalize.
   * @returns The normalized HTS code.
   */
  const normalizeCode = useCallback((code: string): string => {
    return code
      .trim()
      .replace(/%d/g, '%d') // Preserve lowercase '%d'
      .toUpperCase()
      .replace(/%D/g, '%d'); // Convert any uppercase '%D' to '%d'
  }, []);

  /**
   * Parses a section of the HTS code to count valid digit placeholders.
   *
   * @param section The section of the HTS code to parse.
   * @param sectionIndex The index of the section (0-based).
   * @returns The number of valid digit placeholders.
   * @throws Will throw an error if the section contains invalid syntax or characters.
   */
  const parseSection = useCallback((section: string, sectionIndex: number): number => {
    let i = 0;
    let digitCount = 0;

    while (i < section.length) {
      const char = section[i];

      // 1) Check if it's a range start '{'
      if (char === '{') {
        const closeIndex = section.indexOf('}', i + 1);
        if (closeIndex === -1) {
          throw new Error(`Missing '}' in range at: "${section.slice(i)}"`);
        }

        // Extract the inside "x-y"
        const inside = section.slice(i + 1, closeIndex);
        const [startStr, endStr] = inside.split('-');
        if (!endStr) {
          throw new Error(`Invalid range syntax "{${inside}}". Expected "{x-y}".`);
        }

        const startNum = parseInt(startStr, 10);
        const endNum = parseInt(endStr, 10);
        if (isNaN(startNum) || isNaN(endNum)) {
          throw new Error(`Range "{${inside}}" must contain digits only (e.g. "{3-5}").`);
        }
        if (startNum > endNum) {
          throw new Error(`Invalid range "{${inside}}": start cannot exceed end.`);
        }
        if (startNum < 0 || endNum > 9) {
          throw new Error(`Range "{${inside}}": must be within 0–9.`);
        }

        digitCount += 1; // valid range => +1 digit placeholder
        i = closeIndex + 1;
      }
      // 2) Check if it's a wildcard '%d'
      else if (char === '%' && section[i + 1] === 'd') { // Lowercase 'd'
        digitCount += 1;
        i += 2; // skip "%d"
      }
      // 3) Check if it's a standalone '%'
      else if (char === '%') {
        throw new Error(`Incomplete wildcard '%'. Please follow '%' with 'd'.`);
      }
      // 4) Check if it's a '*' representing the entire section
      else if (char === '*') {
        // '*' must be the only character in the section
        if (section.length !== 1) {
          throw new Error(`'*' must occupy the entire section: "${section}"`);
        }
        // Count based on section index
        if (sectionIndex === 0) {
          digitCount += 4; // First section
        } else {
          digitCount += 2; // Other sections
        }
        i += 1;
      }
      // 5) If it's a digit [0-9], count it as 1
      else if (/[0-9]/.test(char)) {
        digitCount += 1;
        i += 1;
      }
      // 6) Otherwise => invalid character
      else {
        throw new Error(`Invalid character "${char}" in section "${section}".`);
      }
    }

    return digitCount;
  }, []);

  /**
   * Validates a single HTS code.
   *
   * @param code The HTS code to validate.
   * @throws Will throw an error if the HTS code is invalid or duplicated.
   */
  const validateSingleHTSCode = useCallback((code: string): void => {
    const normalizedCode = normalizeCode(code);
    const sections = normalizedCode.split('.');
    if (sections.length !== 4) {
      throw new Error(`HTS code "${code.trim()}" must have 4 sections (xxxx.xx.xx.xx).`);
    }

    const expectedDigits = [4, 2, 2, 2];
    sections.forEach((section, idx) => {
      const required = expectedDigits[idx];

      // If section is just '*', it stands in for the entire required digit count
      if (section === '*') {
        // No need to parse; '*' covers the required digit count
        return;
      }

      const count = parseSection(section, idx);
      if (count !== required) {
        throw new Error(
          `Section "${section}" has ${count} digit(s); expected ${required}.`
        );
      }
    });
  }, [normalizeCode, parseSection]);

  /**
   * Validates a single HTS code (public method).
   * Adds the code to the validated list if valid and not duplicated.
   *
   * @param code The HTS code to validate.
   */
  const validateHTSCode = useCallback((code: string): void => {
    const normalizedCode = normalizeCode(code);
    setErrorMessage(null);

    try {
      // Check if the code has been added before
      if (allAddedCodes.has(normalizedCode)) {
        throw new Error(`Duplicated HTS code: "${code.trim()}"`);
      }

      validateSingleHTSCode(normalizedCode);

      // Update sets
      setAllAddedCodes(prevCodes => new Set(prevCodes).add(normalizedCode));

      // Set final result
      setValidationResult({
        validCodes: [normalizedCode],
        invalidCodes: [],
        duplicateCodes: [],
      });
    } catch (err) {
      setValidationResult({
        validCodes: [],
        invalidCodes: [code.trim()],
        duplicateCodes: allAddedCodes.has(normalizedCode) ? [code.trim()] : [],
      });
      setErrorMessage((err as Error).message);
    }
  }, [normalizeCode, validateSingleHTSCode, allAddedCodes]);

  /**
   * Validates multiple comma-separated codes in one go.
   * After finishing, it calls the optional `afterValidation` callback,
   * passing the final `ValidationResult` and the last `errorMessage`.
   *
   * @param codes The HTS codes to validate, separated by commas.
   * @param afterValidation Optional callback after validation.
   */
  const validateHTSCodes = useCallback(
    (
      codes: string,
      afterValidation?: (result: ValidationResult, errorMsg: string | null) => void
    ): void => {
      setErrorMessage(null);

      const codeList = codes
        .split(',')
        .map((c) => normalizeCode(c))
        .filter(c => c.length > 0);
      const validCodes: string[] = [];
      const invalidCodes: string[] = [];
      const duplicateCodes: string[] = [];
      let lastError: string | null = null;

      // Create a new set to accumulate new codes without mutating state inside the loop
      const updatedSet = new Set(allAddedCodes);

      // Detect duplicates within the current batch
      const seenInBatch = new Set<string>();
      const duplicateInBatch = new Set<string>();

      codeList.forEach((code) => {
        if (seenInBatch.has(code)) {
          duplicateInBatch.add(code);
        } else {
          seenInBatch.add(code);
        }
      });

      codeList.forEach((code) => {
        try {
          // Check duplicates across entire existing set
          if (updatedSet.has(code)) {
            throw new Error(`Duplicated HTS code: "${code}"`);
          }
          // Check duplicates in this batch
          if (duplicateInBatch.has(code)) {
            throw new Error(`Duplicated HTS code in input batch: "${code}"`);
          }

          validateSingleHTSCode(code);
          validCodes.push(code);
          updatedSet.add(code);
        } catch (err) {
          const errorMessage = (err as Error).message;
          if (errorMessage.includes('Duplicated HTS code in input batch')) {
            duplicateCodes.push(code);
          } else if (errorMessage.includes('Duplicated HTS code')) {
            duplicateCodes.push(code);
          } else {
            invalidCodes.push(code);
          }
          lastError = errorMessage;
        }
      });

      // After processing all codes, update the state once
      setAllAddedCodes(updatedSet);
      setValidationResult({
        validCodes,
        invalidCodes,
        duplicateCodes,
      });

      if (duplicateCodes.length > 0 || invalidCodes.length > 0) {
        setErrorMessage(lastError);
      } else {
        setErrorMessage(null);
      }

      // Run the callback with the final result and last error message
      if (afterValidation) {
        afterValidation(
          {
            validCodes,
            invalidCodes,
            duplicateCodes,
          },
          lastError
        );
      }
    },
    [normalizeCode, validateSingleHTSCode, allAddedCodes]
  );

  /**
   * Edits multiple existing HTS codes.
   *
   * @param oldHTSCodes The HTS codes to be replaced, separated by commas.
   * @param newHTSCodes The new HTS codes to replace with, separated by commas.
   * @param callback Callback function with error and edited codes as parameters.
   */
  const editHTSCode = useCallback(
    (
      oldHTSCodes: string,
      newHTSCodes: string,
      callback: (error: string | null, resultEditedCodes: EditHTSCodeResult | null) => void
    ): void => {
      setErrorMessage(null);
      setValidationResult(null);

      // Split and normalize the input codes
      const oldCodeList = oldHTSCodes
        .split(',')
        .map(code => normalizeCode(code))
        .filter(code => code.length > 0);
      const newCodeList = newHTSCodes
        .split(',')
        .map(code => normalizeCode(code))
        .filter(code => code.length > 0);

      // Edge Case: If there are no new codes provided
      if (newCodeList.length === 0) {
        callback('No new HTS codes provided for editing.', null);
        setErrorMessage('No new HTS codes provided for editing.');
        return;
      }

      const successfulEdits: { oldCode: string; newCodes: string[] }[] = [];
      const failedEdits: { oldCode: string; newCodes: string[]; error: string }[] = [];

      // Create a new set to accumulate updated codes
      const updatedSet = new Set(allAddedCodes);

      oldCodeList.forEach((oldCode, index) => {
        let newCodesForThisEdit: string[] = [];

        if (index < newCodeList.length) {
          newCodesForThisEdit.push(newCodeList[index]);
        }

        // Assign remaining new codes to the last old code
        if (oldCodeList.length > 0 && index === oldCodeList.length - 1 && newCodeList.length > oldCodeList.length) {
          const remainingNewCodes = newCodeList.slice(oldCodeList.length);
          newCodesForThisEdit.push(...remainingNewCodes);
        }

        // If no new codes are mapped to this old code, flag as failed edit
        // if (newCodesForThisEdit.length === 0) {
        //   failedEdits.push({
        //     oldCode,
        //     newCodes: [],
        //     error: 'No new HTS codes provided for this old HTS code.',
        //   });
        //   return;
        // }

        try {
          // Check if the old code exists
          if (!updatedSet.has(oldCode)) {
            throw new Error(`HTS code "${oldCode}" does not exist and cannot be edited.`);
          }

          // Validate each new code
          newCodesForThisEdit.forEach((newCode) => {
            // Check if the new code already exists (and is not the same as the old code)
            if (updatedSet.has(newCode) && newCode !== oldCode) {
              throw new Error(`HTS code "${newCode}" already exists and cannot be duplicated.`);
            }

            // Validate the new code
            validateSingleHTSCode(newCode);
          });

          // Perform the edits
          updatedSet.delete(oldCode);
          newCodesForThisEdit.forEach((newCode) => {
            updatedSet.add(newCode);
          });

          // Record the successful edit
          successfulEdits.push({ oldCode, newCodes: newCodesForThisEdit });
        } catch (err) {
          // Record the failed edit with the error message
          failedEdits.push({
            oldCode,
            newCodes: newCodesForThisEdit,
            error: (err as Error).message,
          });
        }
      });

      // After processing all edits, update the state
      setAllAddedCodes(updatedSet);

      // Compile the edit results
      const editResult: EditHTSCodeResult = {
        successfulEdits,
        failedEdits,
      };

      // Set the validation result
      setValidationResult({
        validCodes: successfulEdits.flatMap(se => se.newCodes),
        invalidCodes: failedEdits.flatMap(fe => fe.newCodes),
        duplicateCodes: failedEdits
          .filter(fe => fe.error.toLowerCase().includes('duplicated'))
          .flatMap(fe => fe.newCodes),
      });

      // Aggregate error messages
      if (failedEdits.length > 0) {
        const aggregatedError = failedEdits
          .map(fe => `Edit failed for "${fe.oldCode}" → "${fe.newCodes.join(', ')}": ${fe.error}`)
          .join('; ');
        setErrorMessage(aggregatedError);
      } else {
        setErrorMessage(null);
      }

      // Invoke the callback with the edit results
      if (successfulEdits.length === 0 && failedEdits.length === 0) {
        callback('No edits were performed.', null);
      } else {
        callback(null, editResult);
      }
    },
    [normalizeCode, validateSingleHTSCode, allAddedCodes]
  );

  /**
   * Auto-formats multiple HTS codes separated by commas.
   * Formats each code to 'xxxx.xx.xx.xx' as the user types,
   * preserving special patterns like '%d' and '*'.
   *
   * @param codes The HTS codes to format, separated by commas.
   * @returns The auto-formatted HTS codes separated by commas.
   */
  const autoFormatHTSCodes = useCallback((codes: string): string => {
    const codeList = codes.split(',').map(code => code.trim());

    const formattedCodes = codeList.map(code => {
      if (code.length === 0) return '';

      const tokens: string[] = [];
      let i = 0;

      // Tokenize the code, treating '%d' and '*' as single tokens
      while (i < code.length) {
        if (code[i] === '%' && code[i + 1] === 'd') { // Lowercase 'd'
          tokens.push('%d');
          i += 2;
        } else if (code[i] === '%') {
          tokens.push('%');
          i += 1;
        } else if (code[i] === '*') {
          tokens.push('*');
          i += 1;
        } else if (/[0-9]/.test(code[i])) {
          tokens.push(code[i]);
          i += 1;
        } else {
          // Ignore invalid characters
          i += 1;
        }
      }

      // Now, insert dots to format as 'xxxx.xx.xx.xx'
      const sections: string[] = [];
      let currentSection: string[] = [];
      let sectionIndex = 0; // 0-based index

      tokens.forEach((token, index) => {
        // If starting a new section, reset currentSection
        if (currentSection.length === 0) {
          if (token === '*') {
            // '*' must occupy the entire section
            sections.push('*');
            sectionIndex += 1;
            return;
          }
        }

        currentSection.push(token);

        // Determine where to insert dots
        if (sectionIndex === 0 && currentSection.length === 4) {
          sections.push(currentSection.join(''));
          currentSection = [];
          sectionIndex += 1;
        } else if (sectionIndex > 0 && currentSection.length === 2) {
          sections.push(currentSection.join(''));
          currentSection = [];
          sectionIndex += 1;
        }
      });

      // Handle incomplete wildcards by preserving them in the current section
      if (currentSection.length > 0) {
        sections.push(currentSection.join(''));
      }

      return sections.join('.');
    });

    return formattedCodes.join(', ');
  }, []);

  /**
   * Validates multiple HTS codes in real-time with a callback.
   * Does not add the codes to the internal list.
   * Also updates the hook's `errorMessage` state.
   *
   * @param codes The HTS codes to validate, separated by commas.
   * @param callback The callback function to receive the validation result and any error.
   */
  const validateHTSCodeRealTime = useCallback(
    (codes: string, callback: (result: ValidationResult, error: string | null) => void): void => {
      const codeList = codes
        .split(',')
        .map((c) => normalizeCode(c))
        .filter(c => c.length > 0);

      const validCodes: string[] = [];
      const invalidCodes: string[] = [];
      const duplicateCodes: string[] = [];
      let lastError: string | null = null;

      // Detect duplicates within the current batch
      const seenInBatch = new Set<string>();
      const duplicateInBatch = new Set<string>();

      codeList.forEach((code) => {
        if (seenInBatch.has(code)) {
          duplicateInBatch.add(code);
        } else {
          seenInBatch.add(code);
        }
      });

      codeList.forEach((code) => {
        try {
          // Check duplicates across entire existing set
          if (allAddedCodes.has(code)) {
            throw new Error(`Duplicated HTS code: "${code}"`);
          }
          // Check duplicates in this batch
          if (duplicateInBatch.has(code)) {
            throw new Error(`Duplicated HTS code in input batch: "${code}"`);
          }

          // Validate the format
          validateSingleHTSCode(code);

          // If no errors, it's valid
          validCodes.push(code);
        } catch (err) {
          const errorMessage = (err as Error).message;
          if (errorMessage.includes('Duplicated HTS code in input batch')) {
            duplicateCodes.push(code);
          } else if (errorMessage.includes('Duplicated HTS code')) {
            duplicateCodes.push(code);
          } else {
            invalidCodes.push(code);
          }
          lastError = errorMessage;
        }
      });

      const result: ValidationResult = {
        validCodes,
        invalidCodes,
        duplicateCodes,
      };

      // Update the hook's errorMessage state
      if (duplicateCodes.length > 0 || invalidCodes.length > 0) {
        setErrorMessage(lastError);
      } else {
        setErrorMessage(null);
      }

      // Invoke the callback with the result and the last error
      callback(result, lastError);
    },
    [normalizeCode, validateSingleHTSCode, allAddedCodes]
  );

  /**
   * Resets validation state.
   */
  const resetValidation = useCallback((): void => {
    setValidationResult(null);
    setErrorMessage(null);
  }, []);

  /**
   * Clears all previously added codes.
   */
  const clearAllCodes = useCallback((): void => {
    setAllAddedCodes(new Set());
  }, []);

  // Return the hook's methods and states
  return {
    validateHTSCode,
    validateHTSCodes,
    editHTSCode,
    validateHTSCodeRealTime,
    autoFormatHTSCodes,
    resetValidation,
    clearAllCodes,
    validationResult,
    errorMessage,
  } as UseHTSValidatorReturn;
};
