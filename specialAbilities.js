// ============================================================
// specialAbilities.js – Custom champion ability rendering
// ============================================================

// ---------- Dependency (assumed available globally) ----------
// abilityMap: object { championName: { abilityName: url, ... } }

// ---------- Helper: Hwei variant URL generator (unchanged) ----------
function getHweiVariantUrls(championName, abilityName, variantLabels) {
    const urls = [];
    for (const label of variantLabels) {
        // Try to get from abilityMap first
        const variantUrls = getWikiAbilityIcons(championName, label);
        if (variantUrls.length > 0) {
            urls.push(variantUrls[0]);
            continue;
        }
        // Fallback: construct URL from filename pattern
        const shortName = abilityName.replace('Subject: ', '');
        const filePart = `Subject-_${shortName}`;
        const url = `https://wiki.leagueoflegends.com/en-us/images/Hwei_${filePart}_${label}_HD.png`;
        urls.push(url);
        console.log(`🔧 Hwei fallback URL for ${label}: ${url}`);
    }
    return urls;
}

// ---------- Centralized rendering & finalisation ----------

/**
 * Renders an array of {name, variants} into the container.
 * @param {HTMLElement} container
 * @param {{name: string, variants: string[]}[]} items
 * @param {string} championId   - champ.id from DDragon
 * @param {string} extraClass   - additional CSS class (e.g. 'aphelios-grid')
 */
function renderVariantAbilities(container, items, championId, extraClass = '') {
    if (!items.length) return false;

    const gridClass = extraClass ? `abilities-grid ${extraClass}` : 'abilities-grid';
    const parts = [`<div class="${gridClass}">`];

    // Loop through items
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const { name, variants } = item;

        // Determine type and index
        let type, index;
        if (i === 0) {
            type = 'passive';
            index = '-1';
        } else {
            type = 'spell';
            index = (i - 1).toString();  // 0,1,2,3 for Q,W,E,R
        }

        if (!variants || variants.length === 0) {
            parts.push(`<div class="ability-item" 
                         data-champion="${championId}" 
                         data-ability-type="${type}" 
                         data-spell-index="${index}"
                         title="${name}">
                <div style="width:100%;height:100%;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;color:#666;font-size:10px;border-radius:4px;">?</div>
                <span class="tooltip"></span>
            </div>`);
            continue;
        }

        const isSingle = variants.length === 1;
        const firstUrl = variants[0];
        const dataVariants = variants.map(encodeURIComponent).join('||');

        parts.push(`<div class="ability-item" 
                     data-champion="${championId}" 
                     data-ability-type="${type}" 
                     data-spell-index="${index}"
                     title="${name}">
            <img src="${firstUrl}" alt="${name}"
                 data-variants="${dataVariants}" data-current="0"
                 loading="eager"
                 style="cursor:${isSingle ? 'default' : 'pointer'};">
            <span class="tooltip"></span>
        </div>`);
    }

    parts.push('</div>');
    container.innerHTML = parts.join('');

    // Attach tooltip events (new)
    if (window.attachAbilityTooltips) {
        window.attachAbilityTooltips(container);
    }

    // Ensure cycling and preloading still work (your existing code)
    ensureDelegation(container);
    finalizePreloading(container);

    return true;
}

// ---------- Event delegation (click + error), set up once ----------
function ensureDelegation(container) {
    if (container._abilitiesDelegationSetup) return;
    container._abilitiesDelegationSetup = true;

    // Click on any .ability-item img cycles through its variants
    container.addEventListener('click', function (e) {
        const img = e.target.closest('.ability-item img');
        if (!img) return;
        const variantsAttr = img.getAttribute('data-variants');
        if (!variantsAttr) return;
        const variants = variantsAttr.split('||').map(decodeURIComponent);
        if (variants.length <= 1) return;

        let current = parseInt(img.getAttribute('data-current') || '0');
        current = (current + 1) % variants.length;
        img.setAttribute('data-current', current);
        img.src = variants[current];
    });

    // Catch load errors on any .ability-item img (capture phase for reliability)
    container.addEventListener('error', function (e) {
        const img = e.target;
        if (img.tagName !== 'IMG' || !img.closest('.ability-item')) return;
        console.log(`❌ Failed to load HD icon for ${img.alt}:`, img.src);
        img.style.display = 'none';
    }, true);
}

// ---------- Preload variants, skipping the already displayed one ----------
function finalizePreloading(container) {
    const imgs = container.querySelectorAll('.ability-item img');
    const urlsToPreload = new Set();

    for (const img of imgs) {
        const variantsAttr = img.getAttribute('data-variants');
        if (!variantsAttr) continue;
        const variants = variantsAttr.split('||').map(decodeURIComponent);
        // Index 0 is already the <img src>, browser will load it – skip
        for (let i = 1; i < variants.length; i++) {
            urlsToPreload.add(variants[i]);
        }
    }

    if (urlsToPreload.size > 0) {
        console.log(`🔄 Preloading ${urlsToPreload.size} variant images...`);
        for (const url of urlsToPreload) {
            const preImg = new Image();
            preImg.src = url;
        }
    }
}

// ============================================================
// Champion‑specific item builders (return {name, variants}[])
// ============================================================

function buildApheliosItems(champ) {
    return [
        {
            name: 'The Hitman and the Seer',
            variants: ['https://wiki.leagueoflegends.com/en-us/images/Aphelios_The_Hitman_and_the_Seer.png?ff50c']
        },
        {
            name: 'Calibrum',
            variants: [
                'https://wiki.leagueoflegends.com/en-us/images/archive/20241127180314%21Aphelios_Calibrum.png?ad743',
                'https://wiki.leagueoflegends.com/en-us/images/Aphelios_Moonshot_HD.jpg'
            ]
        },
        {
            name: 'Severum',
            variants: [
                'https://wiki.leagueoflegends.com/en-us/images/archive/20241127180455%21Aphelios_Severum.png?31fb1',
                'https://wiki.leagueoflegends.com/en-us/images/Aphelios_Onslaught_HD.jpg'
            ]
        },
        {
            name: 'Gravitum',
            variants: [
                'https://wiki.leagueoflegends.com/en-us/images/archive/20241127180408%21Aphelios_Gravitum.png?45061',
                'https://wiki.leagueoflegends.com/en-us/images/Aphelios_Binding_Eclipse_HD.jpg'
            ]
        },
        {
            name: 'Infernum',
            variants: [
                'https://wiki.leagueoflegends.com/en-us/images/archive/20241127180437%21Aphelios_Infernum.png?54c5a',
                'https://wiki.leagueoflegends.com/en-us/images/Aphelios_Duskwave_HD.jpg'
            ]
        },
        {
            name: 'Crescendum',
            variants: [
                'https://wiki.leagueoflegends.com/en-us/images/archive/20241127180332%21Aphelios_Crescendum.png?fc333',
                'https://wiki.leagueoflegends.com/en-us/images/Aphelios_Sentry_HD.jpg'
            ]
        },
        {
            name: 'Moonlight Vigil',
            variants: ['https://wiki.leagueoflegends.com/en-us/images/Aphelios_Moonlight_Vigil_HD.jpg']
        }
    ];
}

function buildHweiItems(champ) {
    const abilityMapHwei = {
        'Subject: Disaster': { label: 'Q', variants: ['QQ', 'QW', 'QE'] },
        'Subject: Serenity': { label: 'W', variants: ['WQ', 'WW', 'WE'] },
        'Subject: Torment': { label: 'E', variants: ['EQ', 'EW', 'EE'] },
        'Spiraling Despair': { label: 'R', variants: ['R'] }
    };

    const items = [];

    // Passive first
    if (champ.passive) {
        const variantUrls = getWikiAbilityIcons(champ.name, champ.passive.name);
        items.push({ name: champ.passive.name, variants: variantUrls });
    }

    champ.spells.forEach(spell => {
        const mapping = abilityMapHwei[spell.name];
        if (mapping) {
            const variantUrls = getHweiVariantUrls(champ.name, spell.name, mapping.variants);
            items.push({ name: spell.name, variants: variantUrls });
        } else {
            const variantUrls = getWikiAbilityIcons(champ.name, spell.name);
            items.push({ name: spell.name, variants: variantUrls });
        }
    });

    return items;
}

function buildKarmaItems(champ) {
    const karmaEmpoweredMap = {
        'Inner Flame': 'Soulflare',
        'Focused Resolve': 'Renewal',
        'Inspire': 'Defiance'
    };

    const items = [];
    if (champ.passive) {
        const variantUrls = getWikiAbilityIcons(champ.name, champ.passive.name);
        items.push({ name: champ.passive.name, variants: variantUrls });
    }

    champ.spells.forEach(spell => {
        const baseName = spell.name;
        let variantUrls = [];
        if (karmaEmpoweredMap[baseName]) {
            const empoweredName = karmaEmpoweredMap[baseName];
            const normalUrls = getWikiAbilityIcons(champ.name, baseName);
            const empoweredUrls = getWikiAbilityIcons(champ.name, empoweredName);
            if (normalUrls.length > 0) variantUrls.push(normalUrls[0]);
            if (empoweredUrls.length > 0) variantUrls.push(empoweredUrls[0]);
        } else {
            variantUrls = getWikiAbilityIcons(champ.name, baseName);
        }
        items.push({ name: baseName, variants: variantUrls });
    });

    return items;
}

function buildKhaZixItems(champ) {
    const khaZixEvolvedMap = {
        'Taste Their Fear': 'Evolved Reaper Claws',
        'Void Spike': 'Evolved Spike Racks',
        'Leap': 'Evolved Wings',
        'Void Assault': 'Evolved Adaptive Cloaking'
    };

    const items = [];
    if (champ.passive) {
        const variantUrls = getWikiAbilityIcons(champ.name, champ.passive.name);
        items.push({ name: champ.passive.name, variants: variantUrls });
    }

    champ.spells.forEach(spell => {
        const baseName = spell.name;
        let variantUrls = [];
        if (khaZixEvolvedMap[baseName]) {
            const evolvedName = khaZixEvolvedMap[baseName];
            const normalUrls = getWikiAbilityIcons(champ.name, baseName);
            const evolvedUrls = getWikiAbilityIcons(champ.name, evolvedName);
            if (normalUrls.length > 0) variantUrls.push(normalUrls[0]);
            if (evolvedUrls.length > 0) variantUrls.push(evolvedUrls[0]);
        } else {
            variantUrls = getWikiAbilityIcons(champ.name, baseName);
        }
        items.push({ name: baseName, variants: variantUrls });
    });

    return items;
}

function buildQuinnItems(champ) {
    const quinnVariantMap = {
        'Behind Enemy Lines': ['Behind Enemy Lines', 'Skystrike']
    };

    const items = [];
    if (champ.passive) {
        const variantUrls = getWikiAbilityIcons(champ.name, champ.passive.name);
        items.push({ name: champ.passive.name, variants: variantUrls });
    }

    champ.spells.forEach(spell => {
        const baseName = spell.name;
        let variantUrls = [];
        if (quinnVariantMap[baseName]) {
            const variantNames = quinnVariantMap[baseName];
            for (const name of variantNames) {
                const urls = getWikiAbilityIcons(champ.name, name);
                if (urls.length > 0) variantUrls.push(urls[0]);
            }
        } else {
            variantUrls = getWikiAbilityIcons(champ.name, baseName);
        }
        items.push({ name: baseName, variants: variantUrls });
    });

    return items;
}

function buildRengarItems(champ) {
    const items = [];
    const rengarEntry = abilityMap['Rengar'];
    const passiveVariants = [];

    // Unseen Predator
    const unseenUrls = getWikiAbilityIcons(champ.name, 'Unseen Predator');
    if (unseenUrls.length > 0) {
        passiveVariants.push(unseenUrls[0]);
        console.log(`✅ Rengar passive: Unseen Predator → ${unseenUrls[0]}`);
    } else {
        console.warn('⚠️ Unseen Predator not found');
    }

    // Bonetooth Necklace stages 1–5
    const variantNames = [
        'Bonetooth Necklace',
        'Bonetooth Necklace 2',
        'Bonetooth Necklace 3',
        'Bonetooth Necklace 4',
        'Bonetooth Necklace 5'
    ];
    if (rengarEntry) {
        for (const name of variantNames) {
            if (rengarEntry[name]) {
                passiveVariants.push(rengarEntry[name]);
                console.log(`✅ Rengar variant: ${name} → ${rengarEntry[name]}`);
            } else {
                console.warn(`⚠️ Rengar variant not found in JSON: ${name}`);
            }
        }
    } else {
        // Fallback: fuzzy lookup
        for (const name of variantNames) {
            const urls = getWikiAbilityIcons(champ.name, name);
            if (urls.length > 0) passiveVariants.push(urls[0]);
        }
    }

    const passiveName = champ.passive ? champ.passive.name : 'Passive';
    items.push({ name: passiveName, variants: passiveVariants.length ? passiveVariants : unseenUrls });

    // Spells
    champ.spells.forEach(spell => {
        const variantUrls = getWikiAbilityIcons(champ.name, spell.name);
        items.push({ name: spell.name, variants: variantUrls });
    });

    return items;
}

function buildSwainItems(champ) {
    const swainVariantMap = {
        'Demonic Ascension': ['Demonic Ascension', 'Demonflare']
    };

    const items = [];
    if (champ.passive) {
        const variantUrls = getWikiAbilityIcons(champ.name, champ.passive.name);
        items.push({ name: champ.passive.name, variants: variantUrls });
    }

    champ.spells.forEach(spell => {
        const baseName = spell.name;
        let variantUrls = [];
        if (swainVariantMap[baseName]) {
            const variantNames = swainVariantMap[baseName];
            for (const name of variantNames) {
                const urls = getWikiAbilityIcons(champ.name, name);
                if (urls.length > 0) variantUrls.push(urls[0]);
            }
        } else {
            variantUrls = getWikiAbilityIcons(champ.name, baseName);
        }
        items.push({ name: baseName, variants: variantUrls });
    });

    return items;
}

function buildTahmKenchItems(champ) {
    const items = [];
    if (champ.passive) {
        const variantUrls = getWikiAbilityIcons(champ.name, champ.passive.name);
        items.push({ name: champ.passive.name, variants: variantUrls });
    }

    champ.spells.forEach(spell => {
        const baseName = spell.name;
        let variantUrls = [];
        if (baseName === 'Devour') {
            const devourUrls = getWikiAbilityIcons(champ.name, 'Devour');
            const regurgitateUrls = getWikiAbilityIcons(champ.name, 'Regurgitate');
            if (devourUrls.length > 0) variantUrls.push(devourUrls[0]);
            if (regurgitateUrls.length > 0) variantUrls.push(regurgitateUrls[0]);
        } else {
            variantUrls = getWikiAbilityIcons(champ.name, baseName);
        }
        items.push({ name: baseName, variants: variantUrls });
    });

    return items;
}

function buildViktorItems(champ) {
    const items = [];
    const viktorEntry = abilityMap['Viktor'];

    // Passive
    if (champ.passive) {
        let passiveUrl = null;
        if (viktorEntry && viktorEntry['Glorious Evolution']) {
            passiveUrl = viktorEntry['Glorious Evolution'];
            console.log(`✅ Viktor passive: Glorious Evolution → ${passiveUrl}`);
        } else {
            const urls = getWikiAbilityIcons(champ.name, 'Glorious Evolution');
            if (urls.length > 0) passiveUrl = urls[0];
        }
        items.push({ name: champ.passive.name, variants: passiveUrl ? [passiveUrl] : [] });
    }

    const evolutionMap = {
        'Siphon Power': ['Discharge', 'Glorious Evolution 2'],
        'Gravity Field': ['Glorious Evolution 3'],
        'Hextech Ray': ['Glorious Evolution 4'],
        'Arcane Storm': ['Arcane Storm 2']
    };

    champ.spells.forEach(spell => {
        const baseName = spell.name;
        let variantUrls = [];

        if (evolutionMap[baseName]) {
            let normalUrl = null;
            if (viktorEntry && viktorEntry[baseName]) {
                normalUrl = viktorEntry[baseName];
            } else {
                const urls = getWikiAbilityIcons(champ.name, baseName);
                if (urls.length > 0) normalUrl = urls[0];
            }
            if (normalUrl) variantUrls.push(normalUrl);

            const evolvedNames = evolutionMap[baseName];
            for (const evoName of evolvedNames) {
                let evoUrl = null;
                if (viktorEntry && viktorEntry[evoName]) {
                    evoUrl = viktorEntry[evoName];
                    console.log(`✅ Viktor evolved ${baseName} → ${evoName}: ${evoUrl}`);
                } else {
                    const urls = getWikiAbilityIcons(champ.name, evoName);
                    if (urls.length > 0) evoUrl = urls[0];
                }
                if (evoUrl) variantUrls.push(evoUrl);
            }
        } else {
            variantUrls = getWikiAbilityIcons(champ.name, baseName);
        }

        items.push({ name: baseName, variants: variantUrls });
    });

    return items;
}

// ============================================================
// Twisted Fate – Pick a Card variants
// ============================================================
function buildTwistedFateItems(champ) {
    const items = [];

    // Passive: Loaded Dice (if present)
    if (champ.passive) {
        const variantUrls = getWikiAbilityIcons(champ.name, champ.passive.name);
        items.push({ name: champ.passive.name, variants: variantUrls });
    }

    // Spells: Q, W, E, R
    champ.spells.forEach(spell => {
        const baseName = spell.name;
        let variantUrls = [];

        if (baseName === 'Pick a Card') {
            // Base icon + three card variants
            variantUrls = [
                'https://wiki.leagueoflegends.com/en-us/images/Twisted_Fate_Pick_a_Card_HD.png',
                'https://wiki.leagueoflegends.com/en-us/images/Twisted_Fate_Blue_Card_HD.png',
                'https://wiki.leagueoflegends.com/en-us/images/Twisted_Fate_Gold_Card_HD.png',
                'https://wiki.leagueoflegends.com/en-us/images/Twisted_Fate_Red_Card_HD.png'
            ];
        } else {
            // All other abilities use the normal lookup
            variantUrls = getWikiAbilityIcons(champ.name, baseName);
        }

        items.push({ name: baseName, variants: variantUrls });
    });

    return items;
}

// ============================================================
// Main dispatcher
// ============================================================
function renderSpecialChampion(container, champ) {
    let items = null;
    let extraClass = '';

    switch (champ.name) {
        case 'Aphelios':
            items = buildApheliosItems(champ);
            extraClass = 'aphelios-grid';
            break;
        case 'Hwei':
            items = buildHweiItems(champ);
            break;
        case 'Karma':
            items = buildKarmaItems(champ);
            break;
        case "Kha'Zix":
            items = buildKhaZixItems(champ);
            break;
        case 'Quinn':
            items = buildQuinnItems(champ);
            break;
        case 'Rengar':
            items = buildRengarItems(champ);
            break;
        case 'Swain':
            items = buildSwainItems(champ);
            break;
        case 'Tahm Kench':
            items = buildTahmKenchItems(champ);
            break;
        case 'Viktor':
            items = buildViktorItems(champ);
            break;
        case 'Twisted Fate':
            items = buildTwistedFateItems(champ);
            break;
        default:
            return false;
    }

    // Pass champion ID to renderVariantAbilities
    return renderVariantAbilities(container, items, champ.id, extraClass);
}

// Optional: log that the script loaded successfully
console.log('✅ specialAbilities.js loaded successfully');