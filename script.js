/**
 * VEDIC ASTROLOGY SUB-LORD CALCULATOR - MATHEMATICAL ENGINE & CONTROLLER
 * Full 360° Zodiac Calculation Engine based on Vimshottari Dasha Proportions
 * Memory-only execution: No database, no backend, no storage.
 */

// ==========================================================================
// 1. CONSTANTS & DATA STRUCTURES
// ==========================================================================

const RASIS = [
    { id: 0, name: "Mesha / Aries", startDeg: 0, endDeg: 30, startArcmin: 0, endArcmin: 1800 },
    { id: 1, name: "Vrishabha / Taurus", startDeg: 30, endDeg: 60, startArcmin: 1800, endArcmin: 3600 },
    { id: 2, name: "Mithuna / Gemini", startDeg: 60, endDeg: 90, startArcmin: 3600, endArcmin: 5400 },
    { id: 3, name: "Karkataka / Cancer", startDeg: 90, endDeg: 120, startArcmin: 5400, endArcmin: 7200 },
    { id: 4, name: "Simha / Leo", startDeg: 120, endDeg: 150, startArcmin: 7200, endArcmin: 9000 },
    { id: 5, name: "Kanya / Virgo", startDeg: 150, endDeg: 180, startArcmin: 9000, endArcmin: 10800 },
    { id: 6, name: "Tula / Libra", startDeg: 180, endDeg: 210, startArcmin: 10800, endArcmin: 12600 },
    { id: 7, name: "Vrishika / Scorpio", startDeg: 210, endDeg: 240, startArcmin: 12600, endArcmin: 14400 },
    { id: 8, name: "Dhanus / Sagittarius", startDeg: 240, endDeg: 270, startArcmin: 14400, endArcmin: 16200 },
    { id: 9, name: "Makara / Capricorn", startDeg: 270, endDeg: 300, startArcmin: 16200, endArcmin: 18000 },
    { id: 10, name: "Kumbha / Aquarius", startDeg: 300, endDeg: 330, startArcmin: 18000, endArcmin: 19800 },
    { id: 11, name: "Meena / Pisces", startDeg: 330, endDeg: 360, startArcmin: 19800, endArcmin: 21600 }
];

const NAKSHATRAS = [
    { id: 0, name: "Ashwini", lord: "Ketu" },
    { id: 1, name: "Bharani", lord: "Venus" },
    { id: 2, name: "Krittika", lord: "Sun" },
    { id: 3, name: "Rohini", lord: "Moon" },
    { id: 4, name: "Mrigashira", lord: "Mars" },
    { id: 5, name: "Ardra", lord: "Rahu" },
    { id: 6, name: "Punarvasu", lord: "Jupiter" },
    { id: 7, name: "Pushya", lord: "Saturn" },
    { id: 8, name: "Ashlesha", lord: "Mercury" },
    { id: 9, name: "Magha", lord: "Ketu" },
    { id: 10, name: "Purva Phalguni", lord: "Venus" },
    { id: 11, name: "Uttara Phalguni", lord: "Sun" },
    { id: 12, name: "Hasta", lord: "Moon" },
    { id: 13, name: "Chitra", lord: "Mars" },
    { id: 14, name: "Swati", lord: "Rahu" },
    { id: 15, name: "Vishakha", lord: "Jupiter" },
    { id: 16, name: "Anuradha", lord: "Saturn" },
    { id: 17, name: "Jyeshtha", lord: "Mercury" },
    { id: 18, name: "Mula", lord: "Ketu" },
    { id: 19, name: "Purva Ashadha", lord: "Venus" },
    { id: 20, name: "Uttara Ashadha", lord: "Sun" },
    { id: 21, name: "Shravana", lord: "Moon" },
    { id: 22, name: "Dhanishta", lord: "Mars" },
    { id: 23, name: "Shatabhisha", lord: "Rahu" },
    { id: 24, name: "Purva Bhadrapada", lord: "Jupiter" },
    { id: 25, name: "Uttara Bhadrapada", lord: "Saturn" },
    { id: 26, name: "Revati", lord: "Mercury" }
];

const VIMSHOTTARI_YEARS = {
    Ketu: 7,
    Venus: 20,
    Sun: 6,
    Moon: 10,
    Mars: 7,
    Rahu: 18,
    Jupiter: 16,
    Saturn: 19,
    Mercury: 17
};

const VIMSHOTTARI_ORDER = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
];

// Total Vimshottari Cycle Years = 120
// Total Nakshatra Span = 13°20′ = 800 arcminutes = 64 months = 1920 days

// ==========================================================================
// 2. UTILITY & PARSING FUNCTIONS
// ==========================================================================

/**
 * Parses a degree string (e.g. "18°25′", "18 25", "18.41667", "30°30′") into total arcminutes.
 * Returns NaN if parsing fails.
 */
function parseDegree(inputStr) {
    if (typeof inputStr !== 'string') inputStr = String(inputStr || '');
    const cleanStr = inputStr.trim().replace(/deg/gi, '°').replace(/min/gi, '′').replace(/sec/gi, '″');
    if (!cleanStr) return NaN;

    // Check for pure decimal number (e.g. 18.416667)
    if (/^-?\d+(\.\d+)?$/.test(cleanStr)) {
        const val = parseFloat(cleanStr);
        return val * 60;
    }

    // Match degree, minute, second patterns: e.g. 18°25′30″ or 18 25 30 or 18°25'
    const dmsRegex = /^(\d+)[°\s]*(\d+)?['′\s]*(\d+(\.\d+)?)?["″\s]*$/;
    const match = cleanStr.match(dmsRegex);
    if (match) {
        const deg = parseInt(match[1], 10) || 0;
        const min = parseInt(match[2], 10) || 0;
        const sec = parseFloat(match[3]) || 0;
        return deg * 60 + min + sec / 60;
    }

    return NaN;
}

/**
 * Formats total arcminutes into standard Degree, Minute, Second format (e.g. 18°25′00″).
 */
function formatDegree(totalArcmin, includeSeconds = true) {
    if (isNaN(totalArcmin) || totalArcmin < 0) return "0°00′00″";
    // Avoid floating point precision overflow at 360°
    const roundedArcmin = Math.min(21600, Math.max(0, totalArcmin));
    const totalSec = Math.round(roundedArcmin * 60);
    
    const deg = Math.floor(totalSec / 3600);
    const remSec = totalSec % 3600;
    const min = Math.floor(remSec / 60);
    const sec = remSec % 60;

    const minStr = String(min).padStart(2, '0');
    const secStr = String(sec).padStart(2, '0');

    if (includeSeconds) {
        return `${deg}°${minStr}′${secStr}″`;
    }
    return `${deg}°${minStr}′`;
}

/**
 * Gets Rasi object for given total arcminutes.
 */
function getRasi(totalArcmin) {
    const idx = Math.min(11, Math.floor(totalArcmin / 1800));
    return RASIS[idx];
}

/**
 * Gets Nakshatra object for given total arcminutes.
 */
function getNakshatra(totalArcmin) {
    const idx = Math.min(26, Math.floor(totalArcmin / 800));
    return NAKSHATRAS[idx];
}

/**
 * Gets Pada number (1, 2, 3, or 4) for given total arcminutes inside Nakshatra.
 */
function getPada(totalArcmin) {
    const nakshatraRelArcmin = totalArcmin % 800;
    return Math.min(4, Math.floor(nakshatraRelArcmin / 200) + 1);
}

/**
 * Gets Nakshatra Lord name for given Nakshatra index or object.
 */
function getNakshatraLord(nakshatra) {
    if (typeof nakshatra === 'number') {
        return NAKSHATRAS[nakshatra].lord;
    }
    return nakshatra.lord;
}

/**
 * Generates the sequence of 9 Sub-Lords starting from the Nakshatra Lord.
 */
function getSubLordSequence(nakshatraLord) {
    const startIndex = VIMSHOTTARI_ORDER.indexOf(nakshatraLord);
    if (startIndex === -1) return VIMSHOTTARI_ORDER;
    const seq = [];
    for (let i = 0; i < 9; i++) {
        seq.push(VIMSHOTTARI_ORDER[(startIndex + i) % 9]);
    }
    return seq;
}

/**
 * Calculates Sub-Lord duration in months, days, and arcminutes.
 */
function calculateSubLordDuration(planetName) {
    const years = VIMSHOTTARI_YEARS[planetName];
    // Formula: Years / 120 * 64 months
    const durationMonths = (years / 120) * 64;
    // Formula: Duration in months * 30 days = Years * 16
    const durationDays = years * 16;
    // Formula: Duration in months * 12.5 arcminutes = (Years / 120) * 800
    const spanArcmin = (years / 120) * 800;

    return {
        planet: planetName,
        years: years,
        durationMonths: durationMonths,
        durationDays: durationDays,
        spanArcmin: spanArcmin
    };
}

// ==========================================================================
// 3. UI CONTROLLER & DROPDOWN MANAGEMENT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    generateReferenceTable();
});

function initUI() {
    const rasiSelect = document.getElementById('rasi-select');
    const nakshatraSelect = document.getElementById('nakshatra-select');
    const padaSelect = document.getElementById('pada-select');
    const calcBtn = document.getElementById('calc-btn');
    const resetBtn = document.getElementById('reset-btn');
    const toggleRefBtn = document.getElementById('toggle-ref-btn');

    // Populate Rasi Dropdown
    RASIS.forEach(rasi => {
        const opt = document.createElement('option');
        opt.value = rasi.id;
        opt.textContent = `${rasi.id + 1}. ${rasi.name}`;
        rasiSelect.appendChild(opt);
    });

    // Rasi Change Listener
    rasiSelect.addEventListener('change', () => {
        onRasiChange();
    });

    // Nakshatra Change Listener
    nakshatraSelect.addEventListener('change', () => {
        onNakshatraChange();
    });

    // Calculate Button Click
    calcBtn.addEventListener('click', () => {
        calculateResult();
    });

    // Reset Button Click
    resetBtn.addEventListener('click', () => {
        resetForm();
    });

    // Toggle Reference Table Button
    toggleRefBtn.addEventListener('click', () => {
        const refWrapper = document.getElementById('reference-table-wrapper');
        if (refWrapper.classList.contains('hidden')) {
            refWrapper.classList.remove('hidden');
            toggleRefBtn.textContent = 'Hide Reference Table ▲';
        } else {
            refWrapper.classList.add('hidden');
            toggleRefBtn.textContent = 'Show Reference Table ▼';
        }
    });
}

/**
 * Handles Rasi dropdown selection change.
 * Populates only Nakshatras overlapping the selected Rasi.
 */
function onRasiChange() {
    const rasiSelect = document.getElementById('rasi-select');
    const nakshatraSelect = document.getElementById('nakshatra-select');
    const padaSelect = document.getElementById('pada-select');
    hideError();

    const selectedRasiId = parseInt(rasiSelect.value, 10);
    
    // Clear and disable downstream selects if invalid
    nakshatraSelect.innerHTML = '<option value="">-- Select Nakshatra --</option>';
    padaSelect.innerHTML = '<option value="">-- Select Pada --</option>';
    padaSelect.disabled = true;

    if (isNaN(selectedRasiId)) {
        nakshatraSelect.disabled = true;
        return;
    }

    // Filter Nakshatras overlapping selected Rasi
    // Each Rasi has 9 Padas (each 200 arcmin, total 1800 arcmin).
    const rasiStartPadaIdx = selectedRasiId * 9;
    const rasiEndPadaIdx = rasiStartPadaIdx + 8;

    const availableNakshatraIds = new Set();
    for (let pIdx = rasiStartPadaIdx; pIdx <= rasiEndPadaIdx; pIdx++) {
        const nakshatraId = Math.floor(pIdx / 4);
        availableNakshatraIds.add(nakshatraId);
    }

    availableNakshatraIds.forEach(nId => {
        const nak = NAKSHATRAS[nId];
        const opt = document.createElement('option');
        opt.value = nak.id;
        opt.textContent = `${nak.id + 1}. ${nak.name} (${nak.lord})`;
        nakshatraSelect.appendChild(opt);
    });

    nakshatraSelect.disabled = false;
}

/**
 * Handles Nakshatra dropdown selection change.
 * Populates only Padas of selected Nakshatra that belong to the selected Rasi.
 */
function onNakshatraChange() {
    const rasiSelect = document.getElementById('rasi-select');
    const nakshatraSelect = document.getElementById('nakshatra-select');
    const padaSelect = document.getElementById('pada-select');
    hideError();

    const selectedRasiId = parseInt(rasiSelect.value, 10);
    const selectedNakId = parseInt(nakshatraSelect.value, 10);

    padaSelect.innerHTML = '<option value="">-- Select Pada --</option>';

    if (isNaN(selectedRasiId) || isNaN(selectedNakId)) {
        padaSelect.disabled = true;
        return;
    }

    // Filter Padas belonging to selected Rasi
    for (let padaNum = 1; padaNum <= 4; padaNum++) {
        const totalPadaIdx = selectedNakId * 4 + (padaNum - 1);
        const padaRasiId = Math.floor(totalPadaIdx / 9);

        if (padaRasiId === selectedRasiId) {
            const opt = document.createElement('option');
            opt.value = padaNum;
            opt.textContent = `Pada ${padaNum}`;
            padaSelect.appendChild(opt);
        }
    }

    padaSelect.disabled = false;
}

/**
 * Shows error banner with required exact error text.
 */
function showError(msg = "Invalid combination. Please check Rasi, Nakshatra, Pada and Degree.") {
    const errorBanner = document.getElementById('error-banner');
    const errorMsg = document.getElementById('error-message');
    const resultsSection = document.getElementById('results-section');
    
    errorMsg.textContent = msg;
    errorBanner.classList.remove('hidden');
    resultsSection.classList.add('hidden');
}

/**
 * Hides error banner.
 */
function hideError() {
    const errorBanner = document.getElementById('error-banner');
    errorBanner.classList.add('hidden');
}

/**
 * Resets the entire form and results. All client data in memory is cleared.
 */
function resetForm() {
    document.getElementById('calc-form').reset();
    document.getElementById('nakshatra-select').innerHTML = '<option value="">-- Select Nakshatra --</option>';
    document.getElementById('nakshatra-select').disabled = true;
    document.getElementById('pada-select').innerHTML = '<option value="">-- Select Pada --</option>';
    document.getElementById('pada-select').disabled = true;

    hideError();
    document.getElementById('results-section').classList.add('hidden');
}

// ==========================================================================
// 4. MAIN CALCULATION ENGINE
// ==========================================================================

function calculateResult() {
    hideError();

    const clientNameInput = document.getElementById('client-name').value.trim() || 'N/A';
    const dobInput = document.getElementById('dob').value || 'N/A';
    const rasiVal = document.getElementById('rasi-select').value;
    const nakshatraVal = document.getElementById('nakshatra-select').value;
    const padaVal = document.getElementById('pada-select').value;
    const degreeInputRaw = document.getElementById('degree-input').value.trim();

    // 1. Basic selection validation
    if (rasiVal === '' || nakshatraVal === '' || padaVal === '' || degreeInputRaw === '') {
        showError("Invalid combination. Please check Rasi, Nakshatra, Pada and Degree.");
        return;
    }

    const rasiId = parseInt(rasiVal, 10);
    const nakId = parseInt(nakshatraVal, 10);
    const padaNum = parseInt(padaVal, 10);
    const parsedArcmin = parseDegree(degreeInputRaw);

    if (isNaN(parsedArcmin)) {
        showError("Invalid combination. Please check Rasi, Nakshatra, Pada and Degree.");
        return;
    }

    // 2. Validate Pada belongs to Rasi
    const totalPadaIdx = nakId * 4 + (padaNum - 1);
    const padaRasiId = Math.floor(totalPadaIdx / 9);

    if (padaRasiId !== rasiId) {
        showError("Invalid combination. Please check Rasi, Nakshatra, Pada and Degree.");
        return;
    }

    // 3. Compute exact arcminute boundaries for selected Pada and Rasi
    const padaStartArcmin = totalPadaIdx * 200;
    const padaEndArcmin = (totalPadaIdx + 1) * 200;
    const rasiStartArcmin = rasiId * 1800;
    const rasiEndArcmin = (rasiId + 1) * 1800;

    let targetTotalArcmin = -1;

    // Check Case A: Input entered as Total Zodiac Arcminutes (e.g. 30°30′ = 1830′)
    if (parsedArcmin >= padaStartArcmin && parsedArcmin <= padaEndArcmin &&
        parsedArcmin >= rasiStartArcmin && parsedArcmin <= rasiEndArcmin) {
        targetTotalArcmin = parsedArcmin;
    } 
    // Check Case B: Input entered as Rasi-relative Arcminutes (e.g. 0°30′ = 30′ in Vrishabha)
    else {
        const candidateTotal = rasiStartArcmin + parsedArcmin;
        if (candidateTotal >= padaStartArcmin && candidateTotal <= padaEndArcmin) {
            targetTotalArcmin = candidateTotal;
        }
    }

    // If degree does not match selected Rasi/Nakshatra/Pada boundaries
    if (targetTotalArcmin === -1) {
        showError("Invalid combination. Please check Rasi, Nakshatra, Pada and Degree.");
        return;
    }

    // 4. CONTINUOUS SUB-LORD COMPUTATION
    const nakshatra = NAKSHATRAS[nakId];
    const nakshatraStartArcmin = nakId * 800;
    const nakshatraLord = nakshatra.lord;
    const subLordSeq = getSubLordSequence(nakshatraLord);

    let activeSubLord = null;
    let accumulatedArcmin = 0;
    const fullSequenceDetails = [];

    for (let i = 0; i < subLordSeq.length; i++) {
        const planet = subLordSeq[i];
        const dur = calculateSubLordDuration(planet);
        
        const subLordStartRel = accumulatedArcmin;
        const subLordEndRel = accumulatedArcmin + dur.spanArcmin;
        accumulatedArcmin = subLordEndRel;

        const subLordStartTotal = nakshatraStartArcmin + subLordStartRel;
        const subLordEndTotal = nakshatraStartArcmin + subLordEndRel;

        const isCurrent = (targetTotalArcmin >= subLordStartTotal && 
                           (i === 8 ? targetTotalArcmin <= subLordEndTotal : targetTotalArcmin < subLordEndTotal));

        const item = {
            index: i + 1,
            planet: planet,
            years: dur.years,
            durationMonths: dur.durationMonths,
            durationDays: dur.durationDays,
            spanArcmin: dur.spanArcmin,
            startTotalArcmin: subLordStartTotal,
            endTotalArcmin: subLordEndTotal,
            isCurrent: isCurrent
        };

        fullSequenceDetails.push(item);

        if (isCurrent) {
            activeSubLord = item;
        }
    }

    if (!activeSubLord) {
        // Edge fallback to last sub-lord if exact 360° boundary
        activeSubLord = fullSequenceDetails[8];
        activeSubLord.isCurrent = true;
    }

    // 5. REMAINING DURATION & EXACT METRICS
    const elapsedArcmin = targetTotalArcmin - activeSubLord.startTotalArcmin;
    const remainingArcmin = activeSubLord.endTotalArcmin - targetTotalArcmin;
    const remainingMonths = remainingArcmin / 12.5; // 1 month = 12.5 arcmin
    const remainingDays = remainingMonths * 30;

    // 6. RENDER RESULTS TO DOM
    renderResults({
        clientName: clientNameInput,
        dob: dobInput,
        rasiName: RASIS[rasiId].name,
        nakshatraName: nakshatra.name,
        padaNum: padaNum,
        inputDegreeStr: formatDegree(targetTotalArcmin),
        nakshatraLord: nakshatraLord,
        activeSubLord: activeSubLord,
        remainingMonths: remainingMonths,
        remainingDays: remainingDays,
        targetTotalArcmin: targetTotalArcmin,
        sequence: fullSequenceDetails
    });
}

/**
 * Renders calculated data into the DOM result cards and tables.
 */
function renderResults(data) {
    document.getElementById('res-client-name').textContent = data.clientName;
    document.getElementById('res-dob').textContent = data.dob;
    document.getElementById('res-rasi').textContent = data.rasiName;
    document.getElementById('res-nakshatra').textContent = data.nakshatraName;
    document.getElementById('res-pada').textContent = `Pada ${data.padaNum}`;
    document.getElementById('res-input-degree').textContent = data.inputDegreeStr;
    document.getElementById('res-nakshatra-lord').textContent = data.nakshatraLord;

    document.getElementById('res-sub-lord').textContent = data.activeSubLord.planet;
    document.getElementById('res-planetary-years').textContent = `${data.activeSubLord.years} Years`;
    document.getElementById('res-calculation-formula').textContent = 
        `${data.activeSubLord.years} / 120 × 64 = ${data.activeSubLord.durationMonths.toFixed(6)} Months`;
    document.getElementById('res-duration-months').textContent = `${data.activeSubLord.durationMonths.toFixed(6)} Months`;
    document.getElementById('res-duration-days').textContent = `${data.activeSubLord.durationDays} Days`;
    document.getElementById('res-remaining-duration').textContent = 
        `${data.remainingMonths.toFixed(2)} Months (${Math.round(data.remainingDays)} Days)`;

    document.getElementById('res-degree-start').textContent = formatDegree(data.activeSubLord.startTotalArcmin);
    document.getElementById('res-degree-exact').textContent = formatDegree(data.targetTotalArcmin);
    document.getElementById('res-degree-end').textContent = formatDegree(data.activeSubLord.endTotalArcmin);

    document.getElementById('seq-nakshatra-name').textContent = data.nakshatraName;

    // Render Sub-Lord Sequence Table
    const tbody = document.getElementById('sequence-table-body');
    tbody.innerHTML = '';

    data.sequence.forEach(item => {
        const tr = document.createElement('tr');
        if (item.isCurrent) tr.className = 'current-sublord';

        const degSpanFormatted = `${formatDegree(item.spanArcmin, false)}`;
        const rangeFormatted = `${formatDegree(item.startTotalArcmin)} – ${formatDegree(item.endTotalArcmin)}`;
        const statusHtml = item.isCurrent ? '<span class="badge-current">ACTIVE SUB LORD</span>' : '—';

        tr.innerHTML = `
            <td>${item.index}</td>
            <td><strong>${item.planet}</strong></td>
            <td>${item.years} yrs</td>
            <td>${item.durationMonths.toFixed(4)} m</td>
            <td>${item.durationDays} d</td>
            <td>${degSpanFormatted}</td>
            <td class="font-mono">${rangeFormatted}</td>
            <td>${statusHtml}</td>
        `;
        tbody.appendChild(tr);
    });

    // Unhide Results Section and Scroll Smoothly
    const resultsSection = document.getElementById('results-section');
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================================================
// 5. 108 PADAS REFERENCE TABLE GENERATOR
// ==========================================================================

function generateReferenceTable() {
    const tbody = document.getElementById('reference-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    NAKSHATRAS.forEach((nak, nIdx) => {
        const nakStartArcmin = nIdx * 800;

        // Compute Pada Ranges
        const padaRanges = [];
        const nakRasis = new Set();

        for (let p = 0; p < 4; p++) {
            const pStart = nakStartArcmin + p * 200;
            const pEnd = nakStartArcmin + (p + 1) * 200;
            padaRanges.push(`${formatDegree(pStart, false)} - ${formatDegree(pEnd, false)}`);

            const rasiObj = getRasi(pStart);
            nakRasis.add(rasiObj.name.split(' / ')[0]); // Get short name (e.g. Mesha)
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${nIdx + 1}</td>
            <td><strong>${nak.name}</strong></td>
            <td><span class="highlight-terracotta">${nak.lord}</span></td>
            <td>${Array.from(nakRasis).join(', ')}</td>
            <td>${padaRanges[0]}</td>
            <td>${padaRanges[1]}</td>
            <td>${padaRanges[2]}</td>
            <td>${padaRanges[3]}</td>
        `;
        tbody.appendChild(tr);
    });
}
