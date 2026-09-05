/* Revitalization 2029 — pledge form behavior.
   Progressive enhancement: the form posts and validates natively without this file. */
(function () {
  'use strict';

  var form = document.getElementById('pledge-form');
  if (!form) return;

  var status = document.getElementById('pledge-status');
  var PERIODS = { Annually: 1, Quarterly: 4, Monthly: 12 };
  var FINAL_YEAR = 2030;
  var MAX_YEARS = 4;

  /* ---------------------------------------------------------------- date --- */

  var today = form.querySelector('[data-today]');
  if (today) {
    today.value = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  /* --------------------------------------------------- conditional blocks --- */

  function toggle(checkbox) {
    var block = document.getElementById(checkbox.getAttribute('data-reveals'));
    if (!block) return;
    block.hidden = !checkbox.checked;
    if (!checkbox.checked) {
      block.querySelectorAll('input, select, textarea').forEach(function (el) {
        if (el.type === 'number' || el.type === 'text') el.value = '';
      });
    }
    recalculate();
  }

  form.querySelectorAll('[data-reveals]').forEach(function (checkbox) {
    toggle(checkbox);
    checkbox.addEventListener('change', function () { toggle(checkbox); });
  });

  /* --------------------------------------------------------- pledge terms --- */

  var startSelect = form.querySelector('[data-years]');
  var frequency = form.querySelector('[data-frequency]');
  var periodLabel = form.querySelector('[data-period-label]');
  var spanHint = document.getElementById('pledge-span-hint');

  function pledgeYears() {
    if (!startSelect) return 0;
    var start = parseInt(startSelect.value, 10);
    if (isNaN(start)) return 0;
    return Math.max(1, Math.min(MAX_YEARS, FINAL_YEAR - start + 1));
  }

  function describeTerms() {
    var years = pledgeYears();
    if (spanHint) {
      spanHint.textContent = years === 1
        ? 'A single pledge year, ending in ' + FINAL_YEAR + '.'
        : years + ' pledge years, ' + startSelect.value + ' through ' + FINAL_YEAR + '.';
    }
    if (periodLabel && frequency) {
      periodLabel.textContent = { Annually: 'Annual', Quarterly: 'Quarterly', Monthly: 'Monthly' }[frequency.value] || 'Annual';
    }
  }

  if (startSelect) startSelect.addEventListener('change', function () { describeTerms(); recalculate(); });
  if (frequency) frequency.addEventListener('change', function () { describeTerms(); recalculate(); });
  describeTerms();

  /* ------------------------------------------------------------- the tally --- */

  var tallyDisplay = form.querySelector('[data-tally-display]');
  var plannedTotal = form.querySelector('[data-planned-total]');
  var pledgeAmount = form.querySelector('[data-pledge-amount]');
  var plannedTotalEdited = false;

  if (plannedTotal) {
    plannedTotal.addEventListener('input', function () { plannedTotalEdited = true; });
  }

  function money(value) {
    return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function recalculate() {
    var total = 0;

    form.querySelectorAll('[data-sum]').forEach(function (input) {
      if (input.closest('.conditional') && input.closest('.conditional').hidden) return;
      var value = parseFloat(input.value);
      if (!isNaN(value) && value > 0) total += value;
    });

    var pledgeBlock = pledgeAmount ? pledgeAmount.closest('.conditional') : null;
    if (pledgeAmount && pledgeBlock && !pledgeBlock.hidden) {
      var per = parseFloat(pledgeAmount.value);
      var rate = PERIODS[frequency ? frequency.value : 'Annually'] || 1;
      if (!isNaN(per) && per > 0) total += per * rate * pledgeYears();
    }

    if (tallyDisplay) tallyDisplay.textContent = money(total);
    if (plannedTotal && !plannedTotalEdited) plannedTotal.value = total > 0 ? String(Math.round(total)) : '';
  }

  form.addEventListener('input', function (event) {
    if (event.target.matches('[data-sum], [data-pledge-amount]')) recalculate();
  });
  recalculate();

  /* ----------------------------------------------------------- validation --- */

  var MESSAGES = {
    'donor-name': 'Please enter the name the church should record this pledge under.',
    'donor-email': 'Please enter an email address so the church can acknowledge your pledge.',
    signature: 'Please type your full name as your signature.',
    affirm: 'Please confirm this pledge is your own good-faith intention.'
  };

  function errorNode(field) {
    return form.querySelector('[data-error-for="' + field.id + '"]');
  }

  function showError(field, message) {
    var node = errorNode(field);
    if (node) node.textContent = message;
    field.setAttribute('aria-invalid', 'true');
  }

  function clearError(field) {
    var node = errorNode(field);
    if (node) node.textContent = '';
    field.removeAttribute('aria-invalid');
  }

  function validateField(field) {
    if (field.type === 'checkbox') {
      if (field.required && !field.checked) { showError(field, MESSAGES[field.id] || 'This field is required.'); return false; }
    } else if (field.required && !field.value.trim()) {
      showError(field, MESSAGES[field.id] || 'This field is required.');
      return false;
    } else if (field.type === 'email' && field.value && !field.checkValidity()) {
      showError(field, 'Please check this email address.');
      return false;
    }
    clearError(field);
    return true;
  }

  var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));
  required.forEach(function (field) {
    field.addEventListener('blur', function () { validateField(field); });
    field.addEventListener('change', function () { if (field.hasAttribute('aria-invalid')) validateField(field); });
  });

  /* ------------------------------------------------------------ submission --- */

  function setStatus(message, state) {
    if (!status) return;
    status.textContent = message;
    if (state) { status.setAttribute('data-state', state); } else { status.removeAttribute('data-state'); }
    status.hidden = !message;
  }

  form.addEventListener('submit', function (event) {
    var invalid = required.filter(function (field) { return !validateField(field); });

    if (invalid.length) {
      event.preventDefault();
      setStatus('Please complete the highlighted fields before recording your pledge.', 'error');
      invalid[0].focus();
      return;
    }

    if (typeof window.fetch !== 'function') return; /* native POST handles it */

    event.preventDefault();
    var button = form.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; button.textContent = 'Recording…'; }
    setStatus('Recording your pledge…');

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (response) {
      if (!response.ok) throw new Error('Request failed: ' + response.status);
      window.location.assign('/thank-you');
    }).catch(function () {
      if (button) { button.disabled = false; button.textContent = 'Record this pledge'; }
      setStatus(
        'Your pledge could not be recorded just now. Please try again, or call Douglas USA LLC Fundraising at +1 (662) 889-3255 and the committee will record it for you.',
        'error'
      );
    });
  });
})();
