  (function() {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const SUPABASE_URL = 'https://pbriwsgraemyqhkymneq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicml3c2dyYWVteXFoa3ltbmVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTQxNjEsImV4cCI6MjA5MDYzMDE2MX0.AFfCsWNblX3MzjOJVRL7JefLzaLQrsc6xHSeDZuFWrI';

    // ==========================================
    // INGREDIENT DATABASE
    // ==========================================
    const UNSAFE = [
      // Oils
      { names: ['coconut oil', 'cocos nucifera oil', 'cocos nucifera (coconut) oil'], category: 'Oil', reason: 'Contains lauric (C12), myristic (C14), and palmitic (C16) fatty acids that feed Malassezia', alternative: 'MCT oil (C8/C10 only) or squalane' },
      { names: ['olive oil', 'olea europaea fruit oil', 'olea europaea (olive) fruit oil'], category: 'Oil', reason: 'Rich in oleic acid (C18:1), a primary food source for Malassezia', alternative: 'Squalane or mineral oil' },
      { names: ['avocado oil', 'persea gratissima oil', 'persea gratissima (avocado) oil'], category: 'Oil', reason: 'Contains oleic (C18:1) and palmitic (C16) acids that feed Malassezia', alternative: 'Squalane' },
      { names: ['argan oil', 'argania spinosa kernel oil', 'argania spinosa oil'], category: 'Oil', reason: 'High in oleic (C18:1) and linoleic (C18:2) acids that feed Malassezia', alternative: 'Squalane' },
      { names: ['marula oil', 'sclerocarya birrea seed oil'], category: 'Oil', reason: 'Contains oleic acid (C18:1) that feeds Malassezia', alternative: 'Squalane' },
      { names: ['sweet almond oil', 'prunus amygdalus dulcis oil', 'prunus amygdalus dulcis (sweet almond) oil', 'almond oil'], category: 'Oil', reason: 'Contains oleic (C18:1) and linoleic (C18:2) acids that feed Malassezia', alternative: 'Squalane or mineral oil' },
      { names: ['rosehip oil', 'rosa canina seed oil', 'rosa canina fruit oil', 'rosehip seed oil'], category: 'Oil', reason: 'High in linoleic (C18:2) and linolenic (C18:3) acids that feed Malassezia', alternative: 'Squalane' },
      { names: ['jojoba oil', 'simmondsia chinensis seed oil', 'simmondsia chinensis (jojoba) seed oil'], category: 'Oil', reason: 'Contains long-chain fatty acid esters (C20-C22) that can feed Malassezia', alternative: 'Squalane' },
      { names: ['castor oil', 'ricinus communis seed oil', 'ricinus communis (castor) seed oil'], category: 'Oil', reason: 'Contains ricinoleic acid (C18:1) that feeds Malassezia', alternative: 'Mineral oil' },
      { names: ['grapeseed oil', 'vitis vinifera seed oil', 'vitis vinifera (grape) seed oil', 'grape seed oil'], category: 'Oil', reason: 'High in linoleic acid (C18:2) that feeds Malassezia', alternative: 'Squalane' },
      { names: ['sunflower oil', 'helianthus annuus seed oil', 'helianthus annuus (sunflower) seed oil', 'sunflower seed oil'], category: 'Oil', reason: 'High in linoleic (C18:2) and oleic (C18:1) acids that feed Malassezia', alternative: 'Squalane or MCT oil' },
      { names: ['shea butter', 'butyrospermum parkii butter', 'butyrospermum parkii (shea) butter', 'vitellaria paradoxa butter'], category: 'Oil/Butter', reason: 'Contains oleic (C18:1) and stearic (C18) fatty acids that feed Malassezia', alternative: 'Petrolatum or dimethicone' },
      { names: ['cocoa butter', 'theobroma cacao seed butter', 'theobroma cacao (cocoa) seed butter'], category: 'Oil/Butter', reason: 'Contains stearic (C18) and palmitic (C16) fatty acids that feed Malassezia', alternative: 'Petrolatum or dimethicone' },
      // Fatty acids
      { names: ['lauric acid'], category: 'Fatty Acid', reason: 'C12 fatty acid — directly feeds Malassezia', alternative: 'Caprylic acid (C8) or capric acid (C10)' },
      { names: ['myristic acid'], category: 'Fatty Acid', reason: 'C14 fatty acid — directly feeds Malassezia', alternative: 'Caprylic acid (C8)' },
      { names: ['palmitic acid'], category: 'Fatty Acid', reason: 'C16 fatty acid — directly feeds Malassezia', alternative: 'Caprylic acid (C8)' },
      { names: ['stearic acid'], category: 'Fatty Acid', reason: 'C18 fatty acid — feeds Malassezia', alternative: 'Avoid or use silicone-based emollients' },
      { names: ['oleic acid'], category: 'Fatty Acid', reason: 'C18:1 unsaturated fatty acid — a primary food source for Malassezia', alternative: 'Squalane' },
      { names: ['linoleic acid'], category: 'Fatty Acid', reason: 'C18:2 fatty acid — feeds Malassezia', alternative: 'Niacinamide (supports skin barrier without feeding yeast)' },
      { names: ['linolenic acid', 'alpha-linolenic acid'], category: 'Fatty Acid', reason: 'C18:3 fatty acid — feeds Malassezia', alternative: 'Niacinamide' },
      // Esters
      { names: ['isopropyl myristate'], category: 'Ester', reason: 'Ester of myristic acid (C14) — feeds Malassezia and is highly comedogenic', alternative: 'C12-15 alkyl benzoate' },
      { names: ['isopropyl palmitate'], category: 'Ester', reason: 'Ester of palmitic acid (C16) — feeds Malassezia', alternative: 'C12-15 alkyl benzoate or dimethicone' },
      { names: ['glyceryl stearate', 'glyceryl monostearate'], category: 'Ester', reason: 'Ester of stearic acid (C18) — can feed Malassezia', alternative: 'Glyceryl caprylate or silicone-based emulsifiers' },
      { names: ['glyceryl oleate'], category: 'Ester', reason: 'Ester of oleic acid (C18:1) — feeds Malassezia', alternative: 'Silicone-based emulsifiers' },
      { names: ['ethylhexyl palmitate', 'octyl palmitate'], category: 'Ester', reason: 'Ester of palmitic acid (C16) — feeds Malassezia', alternative: 'C12-15 alkyl benzoate' },
      { names: ['cetyl ethylhexanoate'], category: 'Ester', reason: 'Contains C16 cetyl chain — can feed Malassezia', alternative: 'Dimethicone or caprylic/capric triglyceride' },
      { names: ['sorbitan oleate', 'span 80'], category: 'Ester', reason: 'Ester of oleic acid (C18:1) — feeds Malassezia', alternative: 'Silicone-based emulsifiers' },
      { names: ['sorbitan stearate', 'span 60'], category: 'Ester', reason: 'Ester of stearic acid (C18) — can feed Malassezia', alternative: 'Silicone-based emulsifiers' },
      { names: ['sorbitan palmitate', 'span 40'], category: 'Ester', reason: 'Ester of palmitic acid (C16) — feeds Malassezia', alternative: 'Silicone-based emulsifiers' },
      { names: ['cetearyl isononanoate'], category: 'Ester', reason: 'Contains C16/C18 fatty alcohol chains — can feed Malassezia', alternative: 'Dimethicone' },
      { names: ['decyl oleate'], category: 'Ester', reason: 'Ester of oleic acid (C18:1) — feeds Malassezia', alternative: 'Caprylic/capric triglyceride' },
      { names: ['myristyl myristate'], category: 'Ester', reason: 'C14 ester — directly feeds Malassezia', alternative: 'Dimethicone' },
      { names: ['cetyl palmitate'], category: 'Ester', reason: 'C16 ester — feeds Malassezia', alternative: 'Dimethicone or petrolatum' },
      // Polysorbates
      { names: ['polysorbate 20', 'tween 20'], category: 'Polysorbate', reason: 'Derived from lauric acid (C12) — feeds Malassezia', alternative: 'Poloxamer-based emulsifiers' },
      { names: ['polysorbate 40', 'tween 40'], category: 'Polysorbate', reason: 'Derived from palmitic acid (C16) — feeds Malassezia', alternative: 'Poloxamer-based emulsifiers' },
      { names: ['polysorbate 60', 'tween 60'], category: 'Polysorbate', reason: 'Derived from stearic acid (C18) — feeds Malassezia', alternative: 'Poloxamer-based emulsifiers' },
      { names: ['polysorbate 80', 'tween 80'], category: 'Polysorbate', reason: 'Derived from oleic acid (C18:1) — feeds Malassezia', alternative: 'Poloxamer-based emulsifiers' },
      // Fermented
      { names: ['galactomyces ferment filtrate'], category: 'Fermented', reason: 'Fermented yeast byproduct — may aggravate Malassezia-prone skin', alternative: 'Niacinamide for similar brightening benefits' },
      { names: ['saccharomyces ferment filtrate', 'saccharomyces ferment'], category: 'Fermented', reason: 'Fermented yeast extract — may promote Malassezia overgrowth', alternative: 'Niacinamide' },
      { names: ['aspergillus ferment', 'aspergillus ferment filtrate'], category: 'Fermented', reason: 'Fermented fungal ingredient — may aggravate Malassezia conditions', alternative: 'Enzymatic exfoliants like papain' },
      { names: ['lactobacillus ferment', 'lactobacillus ferment filtrate', 'lactobacillus ferment lysate'], category: 'Fermented', reason: 'Fermented ingredient that may disrupt skin microbiome in Malassezia-prone skin', alternative: 'Centella asiatica extract' },
      { names: ['bifida ferment lysate'], category: 'Fermented', reason: 'Fermented ingredient that may aggravate Malassezia-prone skin', alternative: 'Centella asiatica or niacinamide' },
      // Extended problematic
      { names: ['peg-100 stearate', 'peg 100 stearate'], category: 'PEG Ester', reason: 'PEG ester of stearic acid (C18) — can feed Malassezia', alternative: 'PEG-free emulsifiers' },
      { names: ['peg-40 stearate', 'peg 40 stearate'], category: 'PEG Ester', reason: 'PEG ester of stearic acid (C18) — can feed Malassezia', alternative: 'PEG-free emulsifiers' },
      { names: ['peg-8 stearate', 'peg 8 stearate'], category: 'PEG Ester', reason: 'PEG ester of stearic acid (C18) — can feed Malassezia', alternative: 'PEG-free emulsifiers' },
      { names: ['lanolin', 'lanolin alcohol', 'lanolin oil'], category: 'Animal Fat', reason: 'Contains a mix of long-chain fatty acid esters (C14-C24) that feed Malassezia', alternative: 'Petrolatum or dimethicone' },
      { names: ['beeswax', 'cera alba'], category: 'Wax', reason: 'Contains palmitate esters (C16) that can feed Malassezia', alternative: 'Synthetic beeswax or dimethicone' },
      { names: ['lecithin', 'soy lecithin', 'hydrogenated lecithin'], category: 'Phospholipid', reason: 'Contains fatty acids (C16-C18) that can feed Malassezia', alternative: 'Silicone-based emulsifiers' },
      { names: ['cholesterol'], category: 'Lipid', reason: 'Can be metabolized by Malassezia species — use with caution', alternative: 'Synthetic ceramides' },
      { names: ['behenic acid'], category: 'Fatty Acid', reason: 'C22 fatty acid — within the C12-C24 range that feeds Malassezia', alternative: 'Silicone-based alternatives' },
      { names: ['arachidic acid', 'eicosanoic acid'], category: 'Fatty Acid', reason: 'C20 fatty acid — within the range that feeds Malassezia', alternative: 'Caprylic acid (C8)' },
      { names: ['isostearic acid'], category: 'Fatty Acid', reason: 'C18 branched fatty acid — can feed Malassezia', alternative: 'Caprylic acid (C8)' },
      { names: ['hemp seed oil', 'cannabis sativa seed oil'], category: 'Oil', reason: 'High in linoleic (C18:2) and linolenic (C18:3) acids that feed Malassezia', alternative: 'Squalane' },
      { names: ['babassu oil', 'orbignya oleifera seed oil'], category: 'Oil', reason: 'Similar to coconut oil — high in lauric (C12) and myristic (C14) acids', alternative: 'MCT oil' },
      { names: ['macadamia oil', 'macadamia integrifolia seed oil', 'macadamia ternifolia seed oil'], category: 'Oil', reason: 'High in oleic acid (C18:1) and palmitoleic acid (C16:1) that feed Malassezia', alternative: 'Squalane' },
      { names: ['soybean oil', 'glycine soja oil', 'glycine soja (soybean) oil'], category: 'Oil', reason: 'Contains linoleic (C18:2) and oleic (C18:1) acids that feed Malassezia', alternative: 'Squalane or mineral oil' },
      { names: ['wheat germ oil', 'triticum vulgare germ oil'], category: 'Oil', reason: 'Contains linoleic (C18:2) and oleic (C18:1) acids that feed Malassezia', alternative: 'Squalane' },
      { names: ['evening primrose oil', 'oenothera biennis oil'], category: 'Oil', reason: 'High in linoleic acid (C18:2) that feeds Malassezia', alternative: 'Squalane' },
      { names: ['borage seed oil', 'borago officinalis seed oil'], category: 'Oil', reason: 'Contains linoleic acid (C18:2) and GLA that feed Malassezia', alternative: 'Squalane' },
      { names: ['meadowfoam seed oil', 'limnanthes alba seed oil'], category: 'Oil', reason: 'Contains C20-C22 fatty acids that feed Malassezia', alternative: 'Squalane' },
      // Additional oils
      { names: ['tamanu oil', 'calophyllum inophyllum seed oil'], category: 'Oil', reason: 'Contains oleic (C18:1) and linoleic (C18:2) acids that feed Malassezia', alternative: 'Squalane' },
      { names: ['sea buckthorn oil', 'hippophae rhamnoides oil', 'hippophae rhamnoides fruit oil'], category: 'Oil', reason: 'Contains palmitoleic (C16:1) and linoleic (C18:2) acids that feed Malassezia', alternative: 'Squalane' },
      { names: ['safflower oil', 'carthamus tinctorius seed oil', 'carthamus tinctorius (safflower) seed oil'], category: 'Oil', reason: 'High in linoleic acid (C18:2) that feeds Malassezia', alternative: 'Squalane' },
      { names: ['sesame oil', 'sesamum indicum seed oil', 'sesamum indicum (sesame) seed oil'], category: 'Oil', reason: 'Contains oleic (C18:1) and linoleic (C18:2) acids that feed Malassezia', alternative: 'Squalane' },
      { names: ['rice bran oil', 'oryza sativa bran oil', 'oryza sativa (rice) bran oil'], category: 'Oil', reason: 'Contains oleic (C18:1) and linoleic (C18:2) acids that feed Malassezia', alternative: 'Squalane or caprylic/capric triglyceride' },
      { names: ['apricot kernel oil', 'prunus armeniaca kernel oil', 'prunus armeniaca (apricot) kernel oil'], category: 'Oil', reason: 'High in oleic acid (C18:1) that feeds Malassezia', alternative: 'Squalane' },
      { names: ['peach kernel oil', 'prunus persica kernel oil'], category: 'Oil', reason: 'Contains oleic (C18:1) and linoleic (C18:2) acids that feed Malassezia', alternative: 'Squalane' },
      { names: ['camellia oil', 'camellia japonica seed oil', 'camellia oleifera seed oil', 'tsubaki oil'], category: 'Oil', reason: 'Very high in oleic acid (C18:1) that feeds Malassezia', alternative: 'Squalane' },
      { names: ['moringa oil', 'moringa oleifera seed oil'], category: 'Oil', reason: 'High in oleic acid (C18:1) that feeds Malassezia', alternative: 'Squalane' },
      { names: ['palm oil', 'elaeis guineensis oil'], category: 'Oil', reason: 'Contains palmitic (C16) and oleic (C18:1) acids that feed Malassezia', alternative: 'Squalane or mineral oil' },
      { names: ['mango butter', 'mangifera indica seed butter'], category: 'Oil/Butter', reason: 'Contains stearic (C18) and oleic (C18:1) fatty acids that feed Malassezia', alternative: 'Petrolatum or dimethicone' },
      { names: ['cupuacu butter', 'theobroma grandiflorum seed butter'], category: 'Oil/Butter', reason: 'Contains stearic (C18) and oleic (C18:1) fatty acids that feed Malassezia', alternative: 'Petrolatum or dimethicone' },
      { names: ['murumuru butter', 'astrocaryum murumuru seed butter'], category: 'Oil/Butter', reason: 'Contains lauric (C12) and myristic (C14) fatty acids that feed Malassezia', alternative: 'Petrolatum' },
      { names: ['kokum butter', 'garcinia indica seed butter'], category: 'Oil/Butter', reason: 'Contains stearic (C18) and oleic (C18:1) fatty acids that feed Malassezia', alternative: 'Petrolatum or dimethicone' },
      // Additional esters
      { names: ['isocetyl stearate'], category: 'Ester', reason: 'Ester of stearic acid (C18) — can feed Malassezia', alternative: 'C12-15 alkyl benzoate' },
      { names: ['octyl stearate', 'ethylhexyl stearate'], category: 'Ester', reason: 'Ester of stearic acid (C18) — feeds Malassezia', alternative: 'C12-15 alkyl benzoate' },
      { names: ['isopropyl linoleate'], category: 'Ester', reason: 'Ester of linoleic acid (C18:2) — feeds Malassezia', alternative: 'C12-15 alkyl benzoate' },
      { names: ['butyl stearate'], category: 'Ester', reason: 'Ester of stearic acid (C18) — feeds Malassezia', alternative: 'Dimethicone' },
      { names: ['oleyl oleate'], category: 'Ester', reason: 'Double oleic acid ester (C18:1) — highly feeds Malassezia', alternative: 'Squalane' },
      { names: ['diisopropyl adipate'], category: 'Ester', reason: 'Contains fatty acid ester chains that may feed Malassezia', alternative: 'Dimethicone' },
      { names: ['glyceryl laurate'], category: 'Ester', reason: 'Ester of lauric acid (C12) — feeds Malassezia', alternative: 'Glyceryl caprylate (C8)' },
      { names: ['propylene glycol stearate'], category: 'Ester', reason: 'Ester of stearic acid (C18) — can feed Malassezia', alternative: 'Propanediol-based alternatives' },
      { names: ['peg-8 oleate', 'peg-8 laurate'], category: 'PEG Ester', reason: 'PEG ester of fatty acid — can feed Malassezia', alternative: 'PEG-free emulsifiers' },
      { names: ['peg-20 stearate', 'peg 20 stearate'], category: 'PEG Ester', reason: 'PEG ester of stearic acid (C18) — can feed Malassezia', alternative: 'PEG-free emulsifiers' },
      { names: ['peg-150 distearate', 'peg 150 distearate'], category: 'PEG Ester', reason: 'PEG ester of stearic acid (C18) — can feed Malassezia', alternative: 'PEG-free emulsifiers' },
      { names: ['sorbitan laurate', 'span 20'], category: 'Ester', reason: 'Ester of lauric acid (C12) — feeds Malassezia', alternative: 'Silicone-based emulsifiers' },
      { names: ['sorbitan tristearate'], category: 'Ester', reason: 'Ester of stearic acid (C18) — can feed Malassezia', alternative: 'Silicone-based emulsifiers' },
      // Additional fatty acids
      { names: ['caprylic acid', 'octanoic acid'], category: 'Fatty Acid (Safe)', reason: 'C8 fatty acid — too short for Malassezia to feed on. Actually antifungal.', alternative: 'No swap needed — this is safe', severity: 'safe_override' },
      { names: ['capric acid', 'decanoic acid'], category: 'Fatty Acid (Safe)', reason: 'C10 fatty acid — too short for Malassezia to feed on', alternative: 'No swap needed — this is safe', severity: 'safe_override' },
      { names: ['palmitoleic acid'], category: 'Fatty Acid', reason: 'C16:1 unsaturated fatty acid — feeds Malassezia', alternative: 'Squalane' },
      { names: ['erucic acid'], category: 'Fatty Acid', reason: 'C22:1 fatty acid — within the C12-C24 range that feeds Malassezia', alternative: 'Caprylic acid (C8)' },
      { names: ['lignoceric acid'], category: 'Fatty Acid', reason: 'C24 fatty acid — at the upper edge of the range that feeds Malassezia', alternative: 'Caprylic acid (C8)' },
      // Additional fermented/yeast
      { names: ['pitera', 'sk-ii pitera'], category: 'Fermented', reason: 'Galactomyces ferment filtrate — fermented yeast byproduct that may aggravate Malassezia-prone skin', alternative: 'Niacinamide for similar brightening' },
      { names: ['yeast extract', 'faex extract'], category: 'Fermented', reason: 'Yeast-derived extract that may promote Malassezia overgrowth', alternative: 'Centella asiatica extract' },
      { names: ['saccharomyces lysate extract'], category: 'Fermented', reason: 'Yeast lysate that may aggravate Malassezia-prone skin', alternative: 'Niacinamide' },
      { names: ['lactococcus ferment lysate'], category: 'Fermented', reason: 'Fermented ingredient that may disrupt skin microbiome for Malassezia-prone skin', alternative: 'Centella asiatica' },
      // Additional waxes and occlusives
      { names: ['carnauba wax', 'copernicia cerifera wax', 'copernicia cerifera (carnauba) wax'], category: 'Wax', reason: 'Contains long-chain fatty acid esters that can feed Malassezia', alternative: 'Synthetic wax or dimethicone' },
      { names: ['candelilla wax', 'euphorbia cerifera wax'], category: 'Wax', reason: 'Contains long-chain fatty acid esters that can feed Malassezia', alternative: 'Synthetic wax or dimethicone' },
      { names: ['japan wax', 'rhus succedanea fruit wax'], category: 'Wax', reason: 'Contains palmitic acid (C16) esters that feed Malassezia', alternative: 'Synthetic wax' },
      { names: ['cetyl esters', 'synthetic wax'], category: 'Wax', reason: 'Contains C16 ester chains that may feed Malassezia', alternative: 'Dimethicone crosspolymer' },
      { names: ['microcrystalline wax', 'cera microcristallina'], category: 'Wax', reason: 'Petroleum-derived wax — generally safe but some formulations blend with fatty esters', alternative: 'Petrolatum' },
    ];

    const CAUTION = [
      { names: ['cetyl alcohol'], category: 'Fatty Alcohol', reason: 'C16 fatty alcohol — debated. Some with Malassezia-prone skin react, but it\'s generally better tolerated than oils', alternative: 'Dimethicone or other silicone emollients' },
      { names: ['stearyl alcohol'], category: 'Fatty Alcohol', reason: 'C18 fatty alcohol — debated. May or may not feed Malassezia depending on individual sensitivity', alternative: 'Dimethicone' },
      { names: ['cetearyl alcohol'], category: 'Fatty Alcohol', reason: 'C16/C18 fatty alcohol mix — debated. Some people tolerate it, others react', alternative: 'Dimethicone or silicone-based emollients' },
      { names: ['glyceryl stearate se'], category: 'Emulsifier', reason: 'Self-emulsifying form of glyceryl stearate — milder concern than pure ester but still contains stearic acid', alternative: 'Silicone-based emulsifiers' },
      { names: ['ceteareth-20', 'ceteareth 20'], category: 'Emulsifier', reason: 'Ethoxylated cetearyl alcohol — lower risk than pure fatty alcohols but may still concern sensitive skin', alternative: 'PEG-free emulsifiers' },
      { names: ['behenyl alcohol'], category: 'Fatty Alcohol', reason: 'C22 fatty alcohol — debated, similar to cetyl/stearyl alcohol', alternative: 'Dimethicone' },
      { names: ['myristyl alcohol'], category: 'Fatty Alcohol', reason: 'C14 fatty alcohol — debated, shorter chain than cetyl but still in range', alternative: 'Dimethicone' },
      { names: ['lauryl alcohol', 'dodecanol'], category: 'Fatty Alcohol', reason: 'C12 fatty alcohol — at the lower edge of the problematic range', alternative: 'Dimethicone' },
      { names: ['sorbitan olivate', 'cetearyl olivate'], category: 'Emulsifier', reason: 'Olive-derived emulsifier containing oleic acid (C18:1) esters — debated', alternative: 'Silicone-based emulsifiers' },
      { names: ['glycol stearate'], category: 'Emulsifier', reason: 'Stearic acid (C18) ester — lower risk in wash-off products but caution in leave-ons', alternative: 'Non-fatty-acid-based pearlizers' },
      { names: ['steareth-2', 'steareth-20', 'steareth-21'], category: 'Emulsifier', reason: 'Ethoxylated stearyl alcohol — lower risk but contains C18 chain', alternative: 'PEG-free emulsifiers' },
      { names: ['ppg-15 stearyl ether'], category: 'Emulsifier', reason: 'Contains C18 stearyl chain — lower risk but debated for Malassezia-prone skin', alternative: 'Silicone-based alternatives' },
    ];

    const SAFE = [
      { names: ['water', 'aqua', 'eau'] },
      { names: ['glycerin', 'glycerine', 'glycerol'] },
      { names: ['hyaluronic acid', 'sodium hyaluronate', 'hyaluronan'] },
      { names: ['niacinamide', 'nicotinamide', 'vitamin b3'] },
      { names: ['squalane'] },
      { names: ['dimethicone'] },
      { names: ['cyclomethicone', 'cyclopentasiloxane', 'cyclohexasiloxane'] },
      { names: ['caprylic/capric triglyceride', 'caprylic capric triglyceride'] },
      { names: ['mct oil', 'medium chain triglycerides', 'medium-chain triglycerides'] },
      { names: ['mineral oil', 'paraffinum liquidum', 'petrolatum liquidum'] },
      { names: ['petrolatum', 'petroleum jelly', 'white petrolatum'] },
      { names: ['urea'] },
      { names: ['aloe vera', 'aloe barbadensis leaf juice', 'aloe barbadensis leaf extract', 'aloe barbadensis'] },
      { names: ['panthenol', 'dexpanthenol', 'provitamin b5', 'd-panthenol'] },
      { names: ['beta-glucan', 'beta glucan'] },
      { names: ['propanediol', '1,3-propanediol'] },
      { names: ['honey', 'mel'] },
      { names: ['azelaic acid'] },
      { names: ['salicylic acid', 'bha', 'beta hydroxy acid'] },
      { names: ['sulfur'] },
      { names: ['zinc pyrithione'] },
      { names: ['centella asiatica extract', 'madecassoside', 'asiaticoside', 'centella asiatica'] },
      { names: ['ceramide np', 'ceramide ap', 'ceramide eop', 'ceramides', 'ceramide 3', 'ceramide 6 ii', 'ceramide 1'] },
      { names: ['allantoin'] },
      { names: ['ketoconazole'] },
      { names: ['selenium sulfide'] },
      { names: ['ciclopirox', 'ciclopirox olamine'] },
      { names: ['piroctone olamine', 'octopirox'] },
      { names: ['tea tree oil', 'melaleuca alternifolia leaf oil', 'melaleuca alternifolia'] },
      { names: ['benzoyl peroxide'] },
      { names: ['adapalene'] },
      { names: ['tretinoin', 'retinoic acid'] },
      { names: ['retinol', 'vitamin a'] },
      { names: ['ascorbic acid', 'vitamin c', 'l-ascorbic acid'] },
      { names: ['sodium ascorbyl phosphate'] },
      { names: ['tocopherol', 'vitamin e', 'tocopheryl acetate'] },
      { names: ['phenoxyethanol'] },
      { names: ['ethylhexylglycerin'] },
      { names: ['sodium benzoate'] },
      { names: ['potassium sorbate'] },
      { names: ['butylene glycol'] },
      { names: ['pentylene glycol'] },
      { names: ['hexylene glycol'] },
      { names: ['caprylyl glycol'] },
      { names: ['c12-15 alkyl benzoate'] },
      { names: ['dimethicone crosspolymer', 'dimethicone/vinyl dimethicone crosspolymer'] },
      { names: ['acrylates/c10-30 alkyl acrylate crosspolymer'] },
      { names: ['carbomer', 'carbomer 940', 'carbomer 934'] },
      { names: ['xanthan gum'] },
      { names: ['sodium hydroxide'] },
      { names: ['citric acid'] },
      { names: ['disodium edta', 'edta'] },
      { names: ['titanium dioxide'] },
      { names: ['zinc oxide'] },
      { names: ['iron oxides'] },
      { names: ['mica'] },
      // Additional safe humectants & hydrators
      { names: ['sodium pca'] },
      { names: ['sodium lactate'] },
      { names: ['sorbitol'] },
      { names: ['trehalose'] },
      { names: ['polyglutamic acid'] },
      { names: ['snail secretion filtrate', 'snail mucin'] },
      { names: ['centella asiatica leaf water'] },
      { names: ['madecassic acid'] },
      { names: ['asiatic acid'] },
      // Additional safe emollients & silicones
      { names: ['dimethicone/vinyl dimethicone crosspolymer'] },
      { names: ['cyclopentasiloxane'] },
      { names: ['cyclohexasiloxane'] },
      { names: ['methicone'] },
      { names: ['trisiloxane'] },
      { names: ['dimethiconol'] },
      { names: ['isododecane'] },
      { names: ['isohexadecane'] },
      { names: ['c13-14 isoparaffin'] },
      { names: ['hydrogenated polyisobutene'] },
      // Additional safe preservatives & stabilizers
      { names: ['chlorphenesin'] },
      { names: ['methylparaben'] },
      { names: ['propylparaben'] },
      { names: ['ethylparaben'] },
      { names: ['sorbic acid'] },
      { names: ['benzoic acid'] },
      { names: ['dehydroacetic acid'] },
      { names: ['1,2-hexanediol'] },
      { names: ['ethyl hexanediol'] },
      { names: ['benzyl glycol'] },
      // Additional safe actives & extracts
      { names: ['tranexamic acid'] },
      { names: ['alpha arbutin', 'arbutin'] },
      { names: ['kojic acid'] },
      { names: ['glycolic acid', 'aha', 'alpha hydroxy acid'] },
      { names: ['lactic acid'] },
      { names: ['mandelic acid'] },
      { names: ['bakuchiol'] },
      { names: ['resveratrol'] },
      { names: ['ferulic acid'] },
      { names: ['green tea extract', 'camellia sinensis leaf extract'] },
      { names: ['licorice root extract', 'glycyrrhiza glabra root extract', 'dipotassium glycyrrhizinate'] },
      { names: ['chamomile extract', 'bisabolol', 'chamomilla recutita flower extract'] },
      { names: ['colloidal oatmeal', 'avena sativa kernel extract'] },
      // Additional safe base ingredients
      { names: ['propylene glycol'] },
      { names: ['dipropylene glycol'] },
      { names: ['polysorbate-free emulsifiers'] },
      { names: ['sodium chloride'] },
      { names: ['magnesium aluminum silicate'] },
      { names: ['hydroxyethylcellulose'] },
      { names: ['hydroxypropyl methylcellulose'] },
      { names: ['polyacrylamide'] },
      { names: ['acrylates copolymer'] },
      { names: ['triethanolamine'] },
      { names: ['aminomethyl propanol'] },
      { names: ['arginine'] },
      { names: ['betaine'] },
      { names: ['tromethamine', 'tris'] },
      // Mineral sunscreen actives
      { names: ['octinoxate', 'ethylhexyl methoxycinnamate'] },
      { names: ['octisalate', 'ethylhexyl salicylate'] },
      { names: ['octocrylene'] },
      { names: ['avobenzone', 'butyl methoxydibenzoylmethane'] },
      { names: ['homosalate'] },
      { names: ['ensulizole', 'phenylbenzimidazole sulfonic acid'] },
    ];

    // ==========================================
    // PRE-BUILT PRODUCT DATABASE
    // ==========================================
    const PRODUCTS = [
      { name: 'Foaming Facial Cleanser', brand: 'CeraVe', category: 'Cleanser', inci: 'Water, Cocamidopropyl Hydroxysultaine, Glycerin, Sodium Lauroyl Sarcosinate, PEG-150 Pentaerythrityl Tetrastearate, Niacinamide, Propylene Glycol, Ceramide NP, Ceramide AP, Ceramide EOP, Carbomer, Methylparaben, Sodium Chloride, Sodium Hydroxide, Cholesterol, Phytosphingosine, Xanthan Gum, Propylparaben, Disodium EDTA' },
      { name: 'Moisturizing Cream', brand: 'CeraVe', category: 'Moisturizer', inci: 'Water, Glycerin, Cetearyl Alcohol, Caprylic/Capric Triglyceride, Cetyl Alcohol, Ceteareth-20, Petrolatum, Potassium Phosphate, Ceramide NP, Ceramide AP, Ceramide EOP, Carbomer, Dimethicone, Behentrimonium Methosulfate, Sodium Lauroyl Lactylate, Sodium Hyaluronate, Cholesterol, Phenoxyethanol, Disodium EDTA, Dipotassium Phosphate, Tocopherol, Phytosphingosine, Xanthan Gum, Ethylhexylglycerin' },
      { name: 'SA Smoothing Cleanser', brand: 'CeraVe', category: 'Cleanser', inci: 'Water, Cocamidopropyl Hydroxysultaine, Glycerin, Sodium Lauroyl Sarcosinate, Niacinamide, Gluconolactone, Salicylic Acid, Ceramide NP, Ceramide AP, Ceramide EOP, Cholesterol, Phytosphingosine, Sodium Chloride, Sodium Benzoate, Sodium Hydroxide, Calcium Gluconate, Disodium EDTA' },
      { name: 'Gentle Facial Cleanser', brand: 'Vanicream', category: 'Cleanser', inci: 'Water, Sodium C14-16 Olefin Sulfonate, Cocamidopropyl Hydroxysultaine, Glycerin, Panthenol, Sodium Chloride, Citric Acid' },
      { name: 'Moisturizing Skin Cream', brand: 'Vanicream', category: 'Moisturizer', inci: 'Water, White Petrolatum, Sorbitol, Cetearyl Alcohol, Propylene Glycol, Ceteareth-20, Simethicone, Glyceryl Monostearate, Polyethylene Glycol Monostearate, Sorbic Acid, BHT' },
      { name: 'Toleriane Hydrating Gentle Cleanser', brand: 'La Roche-Posay', category: 'Cleanser', inci: 'Water, Glycerin, Pentaerythrityl Tetraethylhexanoate, Propanediol, Ammonium Polyacryldimethyltauramide, Polysorbate 60, Ceramide NP, Niacinamide, Sodium Chloride, Coco-Betaine, Disodium EDTA' },
      { name: 'Cicaplast Baume B5+', brand: 'La Roche-Posay', category: 'Moisturizer', inci: 'Water, Hydrogenated Polyisobutene, Dimethicone, Glycerin, Butyrospermum Parkii Butter, Panthenol, Butylene Glycol, Aluminum Starch Octenylsuccinate, Propanediol, Cetyl PEG/PPG-10/1 Dimethicone, Tristearin, Zinc Gluconate, Madecassoside, Manganese Gluconate, Copper Gluconate, Acetylated Glycol Stearate, Polyglyceryl-4 Isostearate, Sodium Chloride, Citric Acid, Disodium EDTA' },
      { name: 'Hydro Boost Water Gel', brand: 'Neutrogena', category: 'Moisturizer', inci: 'Water, Dimethicone, Glycerin, Dimethicone/Vinyl Dimethicone Crosspolymer, Phenoxyethanol, Cetearyl Olivate, Sorbitan Olivate, Synthetic Beeswax, Polyacrylamide, C13-14 Isoparaffin, Dimethiconol, Carbomer, Laureth-7, Sodium Hyaluronate, Ethylhexylglycerin, C12-14 Pareth-12, Sodium Hydroxide, Blue 1' },
      { name: 'Micellar Cleansing Water', brand: 'Simple', category: 'Cleanser', inci: 'Water, Hexylene Glycol, Glycerin, Chamomilla Recutita Flower Extract, Panthenol, Niacinamide, DMDM Hydantoin, Cetrimonium Chloride, Disodium EDTA, Iodopropynyl Butylcarbamate' },
      { name: 'Gokujyun Premium Lotion', brand: 'Hada Labo', category: 'Toner', inci: 'Water, Butylene Glycol, Glycerin, PPG-10 Methyl Glucose Ether, Hydroxyethyl Urea, Sodium Acetylated Hyaluronate, Sodium Hyaluronate, Hydroxypropyltrimonium Hyaluronate, Sodium Hyaluronate Crosspolymer, Aphanothece Sacrum Polysaccharide, Diglycerin, Sorbitol, Pentylene Glycol, Triethyl Citrate, PEG-32, PEG-75, Polyquaternium-51, Methylparaben, Propylparaben, Disodium Succinate, Succinic Acid, Disodium EDTA' },
      { name: 'Niacinamide 10% + Zinc 1%', brand: 'The Ordinary', category: 'Serum', inci: 'Water, Niacinamide, Pentylene Glycol, Zinc PCA, Dimethyl Isosorbide, Tamarindus Indica Seed Gum, Xanthan Gum, Isoceteth-20, Ethoxydiglycol, Phenoxyethanol, Chlorphenesin' },
      { name: 'Azelaic Acid Suspension 10%', brand: 'The Ordinary', category: 'Treatment', inci: 'Water, Isodecyl Neopentanoate, Dimethicone, Azelaic Acid, Dimethicone/Bis-Isobutyl PPG-20 Crosspolymer, Dimethyl Isosorbide, Hydroxyethyl Acrylate/Sodium Acryloyldimethyl Taurate Copolymer, Polysilicone-11, Isohexadecane, Tocopherol, Polysorbate 60, Trisodium Ethylenediamine Disuccinate, Isoceteth-20, Sorbitan Stearate, p-Anisic Acid, Ethoxydiglycol, Phenoxyethanol, Chlorphenesin' },
      { name: '100% Plant-Derived Squalane', brand: 'The Ordinary', category: 'Oil', inci: 'Squalane' },
      { name: 'Natural Moisturizing Factors + HA', brand: 'The Ordinary', category: 'Moisturizer', inci: 'Water, Caprylic/Capric Triglyceride, Cetyl Alcohol, Propanediol, Stearyl Alcohol, Glycerin, Sodium Hyaluronate, Arginine, Aspartic Acid, Glycine, Alanine, Serine, Valine, Isoleucine, Proline, Threonine, Histidine, Phenylalanine, Phospholipids, Sodium PCA, PCA, Sodium Lactate, Urea, Allantoin, Linoleic Acid, Oleic Acid, Phytosteryl Canola Glycerides, Palmitic Acid, Stearic Acid, Lecithin, Triolein, Tocopherol, Carbomer, Isoceteth-20, Polysorbate 60, Sodium Chloride, Citric Acid, Trisodium Ethylenediamine Disuccinate, Pentylene Glycol, Triethanolamine, Sodium Hydroxide, Phenoxyethanol, Chlorphenesin' },
      { name: 'Sulfur Ointment 10%', brand: 'De La Cruz', category: 'Treatment', inci: 'Sulfur, Water, Mineral Oil, Zinc Oxide, Propylene Glycol, Steareth-2, Steareth-20, Fragrance' },
      { name: 'Anti-Dandruff Shampoo (Ketoconazole 1%)', brand: 'Nizoral', category: 'Shampoo', inci: 'Water, Sodium Laureth Sulfate, Sodium Lauryl Sulfate, Cocamide MEA, Glycol Distearate, Ketoconazole, Sodium Chloride, Sodium Hydroxide, Hydroxypropyl Methylcellulose, Imidurea, Fragrance, Hydrochloric Acid, Red 40' },
      { name: 'Ultra Repair Cream', brand: 'First Aid Beauty', category: 'Moisturizer', inci: 'Water, Stearic Acid, Glycerin, C12-15 Alkyl Benzoate, Caprylic/Capric Triglyceride, Glyceryl Stearate, Glyceryl Stearate SE, Cetearyl Alcohol, Phenoxyethanol, Caprylyl Glycol, Allantoin, Squalane, Dimethicone, Sodium Hyaluronate, Chrysanthemum Parthenium Extract, Camellia Sinensis Leaf Extract, Glycyrrhiza Glabra Root Extract, Butyrospermum Parkii Butter, Ceramide NP, Eucalyptus Globulus Leaf Extract, Colloidal Oatmeal, Xanthan Gum, Disodium EDTA, Mannan, Carbomer, Potassium Hydroxide' },
      { name: 'Gel Moisturizer', brand: 'Neutrogena Hydro Boost', category: 'Moisturizer', inci: 'Water, Dimethicone, Glycerin, Cetearyl Olivate, Sorbitan Olivate, Dimethicone Crosspolymer, Trehalose, Polyacrylamide, Tocopheryl Acetate, Synthetic Beeswax, Phenoxyethanol, C13-14 Isoparaffin, Glyceryl Polyacrylate, Sodium Hyaluronate, Carbomer, Dimethiconol, Ethylhexylglycerin, C12-14 Pareth-12, Laureth-7, Sodium Hydroxide, Blue 1' },
      { name: 'Daily Moisturizing Lotion', brand: 'CeraVe', category: 'Moisturizer', inci: 'Water, Glycerin, Caprylic/Capric Triglyceride, Behentrimonium Methosulfate, Cetearyl Alcohol, Ceramide NP, Ceramide AP, Ceramide EOP, Carbomer, Dimethicone, Cetyl Alcohol, Petrolatum, Cholesterol, Phenoxyethanol, Polysorbate 20, Potassium Phosphate, Sodium Lauroyl Lactylate, Ceteareth-20, Phytosphingosine, Disodium EDTA, Dipotassium Phosphate, Sodium Hyaluronate, Tocopherol, Xanthan Gum, Ethylhexylglycerin' },
      { name: 'Facial Moisturizing Lotion PM', brand: 'CeraVe', category: 'Moisturizer', inci: 'Water, Glycerin, Caprylic/Capric Triglyceride, Niacinamide, Behentrimonium Methosulfate, Cetearyl Alcohol, Ceramide NP, Ceramide AP, Ceramide EOP, Carbomer, Dimethicone, Cetyl Alcohol, Potassium Phosphate, Sodium Lauroyl Lactylate, Cholesterol, Phenoxyethanol, Phytosphingosine, Disodium EDTA, Tocopherol, Dipotassium Phosphate, Sodium Hyaluronate, Xanthan Gum, Ethylhexylglycerin' },

      // Cleansers – Malassezia community favorites
      { name: 'Gentle Skin Cleanser', brand: 'Cetaphil', category: 'Cleanser', inci: 'Water, Glycerin, Cetearyl Alcohol, Panthenol, Niacinamide, Pantolactone, Xanthan Gum, Sodium Cocoyl Isethionate, Sodium Benzoate, Citric Acid' },
      { name: 'Effaclar Purifying Foaming Gel', brand: 'La Roche-Posay', category: 'Cleanser', inci: 'Water, Sodium Laureth Sulfate, PEG-8, Coco-Betaine, Hexylene Glycol, Sodium Chloride, PEG-120 Methyl Glucose Dioleate, Zinc PCA, Sodium Hydroxide, Citric Acid, Sodium Benzoate, Phenoxyethanol, Caprylyl Glycol, Parfum/Fragrance' },
      { name: 'Matcha Hemp Hydrating Cleanser', brand: 'Krave Beauty', category: 'Cleanser', inci: 'Camellia Sinensis Leaf Water, Water, Glycerin, Dipropylene Glycol, Coco-Betaine, Coco-Glucoside, 1,2-Hexanediol, Butylene Glycol, Caprylic/Capric Triglyceride, Methyl Gluceth-10, Xanthan Gum, Cellulose Gum, Benzyl Glycol, Camellia Sinensis Leaf Powder, Sodium Polyacrylate, Cannabis Sativa Seed Oil, Citric Acid, Ethylhexylglycerin, Disodium EDTA, Sodium Chloride, Panthenol, Sodium PCA, Camellia Sinensis Leaf Extract, Avena Sativa Kernel Extract' },
      { name: 'CLEAR Pore Normalizing Cleanser', brand: "Paula's Choice", category: 'Cleanser', inci: 'Water, Sodium Lauroyl Sarcosinate, Acrylates/Steareth-20 Methacrylate Copolymer, Glycerin, PEG-200 Hydrogenated Glyceryl Palmate, Sodium Laureth Sulfate, Salicylic Acid, Arginine, Butylene Glycol, PEG-7 Glyceryl Cocoate, Panthenol, Disodium EDTA, Citric Acid, PEG-60 Hydrogenated Castor Oil, Sodium Citrate, Phenoxyethanol, Caprylyl Glycol, Chlorphenesin' },

      // Moisturizers – Malassezia community favorites
      { name: 'Ceramide Ato Concentrate Cream', brand: 'Illiyoon', category: 'Moisturizer', inci: 'Water, Butylene Glycol, Glycerin, Dimethicone, Pentaerythrityl Tetraisostearate, Hydrogenated Poly(C6-14 Olefin), Stearic Acid, Behenyl Alcohol, Palmitic Acid, Cetyl Ethylhexanoate, 1,2-Hexanediol, Arachidyl Alcohol, C14-22 Alcohols, Hydroxypropyl Bispalmitamide MEA, Polyacrylate-13, Arachidyl Glucoside, Mannitol, C12-20 Alkyl Glucoside, Polyisobutene, Glyceryl Caprylate, Panax Ginseng Root Water, Ethylhexylglycerin, Acrylates/Ammonium Methacrylate Copolymer, Polysorbate 20, Sorbitan Isostearate, Carbomer, Perilla Ocymoides Seed Extract, Myristic Acid, Arachidic Acid, Cholesterol, Bupleurum Falcatum Root Extract, Angelica Acutiloba Root Extract, Ophiopogon Japonicus Root Extract, Glucose, Silica, Glycine Max Oil, Ceramide NP, Phytosphingosine, Hydrogenated Lecithin, Tocopherol, Canola Oil, Rosmarinus Officinalis Leaf Extract' },
      { name: 'Soon Jung 2x Barrier Intensive Cream', brand: 'Etude', category: 'Moisturizer', inci: 'Water, Propanediol, Pentaerythrityl Tetraethylhexanoate, Caprylic/Capric Triglyceride, Glycerin, Helianthus Annuus Seed Oil, Polyglyceryl-3 Methylglucose Distearate, Butyrospermum Parkii Butter, Cetearyl Alcohol, Panthenol, Madecassoside, Camellia Sinensis Leaf Extract, 1,2-Hexanediol, Potassium Carbomer, Xanthan Gum, Butylene Glycol, Disodium EDTA' },
      { name: 'Clear Face Care Gel', brand: 'Sebamed', category: 'Moisturizer', inci: 'Water, Aloe Barbadensis Leaf Juice, Propylene Glycol, Glycine, Sorbitol, Panthenol, Sodium Hyaluronate, Allantoin, Sodium Carbomer, Sodium Citrate, Phenoxyethanol' },
      { name: 'Original Healing Cream', brand: 'Eucerin', category: 'Moisturizer', inci: 'Water, Petrolatum, Mineral Oil, Ceresin, Lanolin Alcohol, Phenoxyethanol, Piroctone Olamine' },
      { name: 'Daily Moisturizing Lotion', brand: 'Aveeno', category: 'Moisturizer', inci: 'Water, Glycerin, Distearyldimonium Chloride, Petrolatum, Isopropyl Palmitate, Cetyl Alcohol, Dimethicone, Colloidal Oatmeal, Benzyl Alcohol, Sodium Chloride' },

      // Sunscreens – Malassezia community favorites
      { name: 'UV Clear Broad-Spectrum SPF 46', brand: 'EltaMD', category: 'Sunscreen', inci: 'Octinoxate 7.5%, Zinc Oxide 9.0%, Water, Cyclopentasiloxane, Niacinamide, Octyldodecyl Neopentanoate, Hydroxyethyl Acrylate/Sodium Acryloyldimethyl Taurate Copolymer, Butylene Glycol, Phenoxyethanol, Polyisobutene, Triethoxycaprylylsilane, Tocopheryl Acetate, PEG-7 Trimethylolpropane Coconut Ether, Oleth-3 Phosphate, Iodopropynyl Butylcarbamate, Lactic Acid, Sodium Hyaluronate, Phosphoric Acid' },
      { name: 'Centella Green Level Unscented Sun SPF 50+', brand: 'Purito', category: 'Sunscreen', inci: 'Water, Butylene Glycol, Butyloctyl Salicylate, Glycerin, Diethylamino Hydroxybenzoyl Hexyl Benzoate, Hydrogenated Polyisobutene, Acrylates Copolymer, Silica, 1,2-Hexanediol, Niacinamide, Dibutyl Adipate, Ethylhexyl Triazone, Polyglyceryl-3 Methylglucose Distearate, Cetearyl Olivate, Cetearyl Alcohol, Dicaprylyl Carbonate, Sorbitan Olivate, Glyceryl Stearate, Methyl Glucose Sesquistearate, Sorbitan Stearate, Centella Asiatica Extract, Madecassoside, Asiaticoside, Madecassic Acid, Asiatic Acid, Pentaerythrityl Tetra-di-t-butyl Hydroxyhydrocinnamate, Disodium EDTA, Adenosine, Hyaluronic Acid, Caprylyl Glycol, Ethylhexylglycerin, Tocopherol' },
      { name: 'Anthelios Melt-in Milk Sunscreen SPF 60', brand: 'La Roche-Posay', category: 'Sunscreen', inci: 'Homosalate, Ethylhexyl Salicylate, Octocrylene, Dimethicone, Styrene/Acrylates Copolymer, Polymethylsilsesquioxane, Butyloctyl Salicylate, Glycerin, Alcohol Denat, Poly C10-30 Alkyl Acrylate, Caprylyl Methicone, Trisiloxane, Acrylates/Dimethicone Copolymer, Diethylhexyl Syringylidenemalonate, Glyceryl Stearate, PEG-100 Stearate, Phenoxyethanol, Potassium Cetyl Phosphate, Propylene Glycol, Caprylyl Glycol, PEG-8 Laurate, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Triethanolamine, Tocopherol, Inulin Lauryl Carbamate, Disodium EDTA, P-Anisic Acid, Caprylic/Capric Triglyceride, Xanthan Gum, Cassia Alata Leaf Extract, Maltodextrin, Sodium Dodecylbenzenesulfonate' },
      { name: 'UV Aqua Rich Watery Essence SPF 50+', brand: 'Biore', category: 'Sunscreen', inci: 'Water, Ethanol, Octinoxate, Ethylhexyl Triazone, Isopropyl Palmitate, Lauryl Methacrylate/Sodium Methacrylate Crosspolymer, Diethylamino Hydroxybenzoyl Hexyl Benzoate, Hydrogenated Polyisobutene, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine, Dextrin Palmitate, Butylene Glycol, Xylitol, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Dimethicone, C12-15 Alkyl Benzoate, Glycerin, Glyceryl Stearate, Propanediol, Glyceryl Behenate, Vinyl Dimethicone/Methicone Silsesquioxane Crosspolymer, Cetyl Alcohol, Agar, Sorbitan Stearate, Isoceteth-20, Polyvinyl Alcohol, Dimethicone/Vinyl Dimethicone Crosspolymer, Sodium Stearoyl Glutamate, Arginine, Potassium Hydroxide, Sodium Hydroxide, Royal Jelly Extract, Sodium Hyaluronate, Phenoxyethanol, Disodium EDTA, BHT, Fragrance' },

      // Serums & Treatments – Malassezia community favorites
      { name: 'Skin Perfecting 2% BHA Liquid Exfoliant', brand: "Paula's Choice", category: 'Treatment', inci: 'Water, Methylpropanediol, Butylene Glycol, Salicylic Acid, Polysorbate 20, Camellia Oleifera Leaf Extract, Sodium Hydroxide, Tetrasodium EDTA' },
      { name: 'Azelaic Acid 10% Serum', brand: 'Cos De BAHA', category: 'Serum', inci: 'Aloe Barbadensis Leaf Extract, Propylene Glycol, Azelaic Acid, Polysorbate 20, 1,2-Hexanediol, Propanediol, Panthenol, Niacinamide, Sodium Hyaluronate, Camellia Sinensis Leaf Extract, Momordica Charantia Fruit Extract, Sambucus Nigra Flower Extract, Leontopodium Alpinum Extract' },
      { name: 'Discoloration Correcting Serum', brand: 'Good Molecules', category: 'Serum', inci: 'Water, Propanediol, Glycerin, Niacinamide, Cetyl Tranexamate Mesylate, Cetearyl Alcohol, Ceratonia Siliqua Gum, Caprylyl Glycol, Tamarindus Indica Seed Gum, Ethylhexylglycerin' },
      { name: 'Hyaluronic Acid 2% + B5', brand: 'The Ordinary', category: 'Serum', inci: 'Water, Sodium Hyaluronate, Pentylene Glycol, Propanediol, Sodium Hyaluronate Crosspolymer, Panthenol, Ahnfeltia Concinna Extract, Glycerin, Trisodium Ethylenediamine Disuccinate, Citric Acid, Isoceteth-20, Ethoxydiglycol, Ethylhexylglycerin, Hexylene Glycol, 1,2-Hexanediol, Phenoxyethanol, Caprylyl Glycol' },
      { name: 'Glycolic Acid 7% Toning Solution', brand: 'The Ordinary', category: 'Treatment', inci: 'Water, Glycolic Acid, Rosa Damascena Flower Water, Centaurea Cyanus Flower Water, Aloe Barbadensis Leaf Water, Propanediol, Glycerin, Triethanolamine, Aminomethyl Propanol, Panax Ginseng Root Extract, Tasmannia Lanceolata Fruit/Leaf Extract, Aspartic Acid, Alanine, Glycine, Serine, Valine, Isoleucine, Proline, Threonine, Histidine, Phenylalanine, Glutamic Acid, Arginine, PCA, Sodium PCA, Sodium Lactate, Fructose, Glucose, Sucrose, Urea, Hexyl Nicotinate, Dextrin, Citric Acid, Polysorbate 20, Gellan Gum, Trisodium Ethylenediamine Disuccinate, Sodium Chloride, Hexylene Glycol, Potassium Sorbate, Sodium Benzoate, 1,2-Hexanediol, Caprylyl Glycol' },

      // K-Beauty – Malassezia community favorites
      { name: 'Advanced Snail 96 Mucin Power Essence', brand: 'COSRX', category: 'Essence', inci: 'Snail Secretion Filtrate, Betaine, Butylene Glycol, 1,2-Hexanediol, Sodium Polyacrylate, Phenoxyethanol, Sodium Hyaluronate, Allantoin, Ethyl Hexanediol, Carbomer, Panthenol, Arginine' },
      { name: 'BHA Blackhead Power Liquid', brand: 'COSRX', category: 'Treatment', inci: 'Salix Alba (Willow) Bark Water, Butylene Glycol, Betaine Salicylate, Niacinamide, 1,2-Hexanediol, Arginine, Panthenol, Sodium Hyaluronate, Xanthan Gum, Ethyl Hexanediol' },
      { name: 'Aloe Propolis Soothing Gel', brand: 'Benton', category: 'Moisturizer', inci: 'Aloe Barbadensis Leaf Water, Butylene Glycol, Water, Pentylene Glycol, 1,2-Hexanediol, Glycerin, Propolis Extract, Aloe Barbadensis Leaf Extract, Betaine, Cucumis Sativus Fruit Extract, Portulaca Oleracea Extract, Camellia Sinensis Leaf Extract, Allantoin, Aloe Barbadensis Leaf Juice Powder, Zanthoxylum Piperitum Fruit Extract, Pulsatilla Koreana Extract, Usnea Barbata Extract, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Arginine' },
      { name: 'Supple Preparation Unscented Toner', brand: 'Dear, Klairs', category: 'Toner', inci: 'Water, Butylene Glycol, Dimethyl Sulfone, Betaine, Caprylic/Capric Triglyceride, Natto Gum, Sodium Hyaluronate, Disodium EDTA, Centella Asiatica Extract, Glycyrrhiza Glabra Root Extract, Polyquaternium-51, Chlorphenesin, Tocopheryl Acetate, Carbomer, Panthenol, Arginine, Luffa Cylindrica Fruit/Leaf/Stem Extract, Beta-Glucan, Althaea Rosea Flower Extract, Aloe Barbadensis Leaf Extract, Hydroxyethylcellulose, Portulaca Oleracea Extract, Lysine HCl, Proline, Sodium Ascorbyl Phosphate, Acetyl Methionine, Theanine, Copper Tripeptide-1' },

      // Body & Hair – Malassezia community favorites
      { name: 'Medicated Anti-Dandruff Shampoo', brand: 'Selsun Blue', category: 'Shampoo', inci: 'Selenium Sulfide 1%, Water, Ammonium Lauryl Sulfate, Ammonium Laureth Sulfate, Cocamidopropyl Betaine, Magnesium Aluminum Silicate, Fragrance, Cocamide DEA, DMDM Hydantoin, Hydroxypropyl Methylcellulose, Citric Acid, Sodium Citrate, Sodium Chloride, Titanium Dioxide, Blue 1' },
      { name: 'Clinical Strength Shampoo', brand: 'Head & Shoulders', category: 'Shampoo', inci: 'Selenium Sulfide 1%, Water, Ammonium Laureth Sulfate, Ammonium Lauryl Sulfate, Glycol Distearate, Cocamide MEA, Ammonium Xylenesulfonate, Sodium Citrate, Fragrance, Dimethicone, Cetyl Alcohol, Sodium Chloride, Citric Acid, Sodium Benzoate, Stearyl Alcohol, Disodium EDTA, Hydroxypropyl Methylcellulose, Methylchloroisothiazolinone, Methylisothiazolinone' },

      // Additional Cleansers
      { name: 'Hydrating Facial Cleanser', brand: 'CeraVe', category: 'Cleanser', inci: 'Water, Glycerin, Cetearyl Alcohol, PEG-40 Stearate, Stearyl Alcohol, Cetyl Alcohol, Ceramide NP, Ceramide AP, Ceramide EOP, Carbomer, Behentrimonium Methosulfate, Sodium Lauroyl Lactylate, Sodium Hyaluronate, Cholesterol, Phenoxyethanol, Phytosphingosine, Disodium EDTA, Potassium Phosphate, Dipotassium Phosphate, Xanthan Gum, Tocopherol, Ethylhexylglycerin' },
      { name: 'Soy Makeup Removing Face Wash', brand: 'Fresh', category: 'Cleanser', inci: 'Water, Glycerin, Sodium Cocoyl Isethionate, Cocamidopropyl Betaine, Decyl Glucoside, PEG-120 Methyl Glucose Dioleate, Acrylates Copolymer, Glycine Soja Seed Extract, Cucumis Sativus Fruit Extract, Rosa Damascena Flower Water, Sodium Chloride, Citric Acid, Sodium Hydroxide, Phenoxyethanol, Ethylhexylglycerin' },
      { name: 'Low pH Good Morning Gel Cleanser', brand: 'COSRX', category: 'Cleanser', inci: 'Water, Cocamidopropyl Betaine, Sodium Lauroyl Methyl Isethionate, Polysorbate 20, Styrax Japonicus Branch/Fruit/Leaf Extract, Butylene Glycol, Saccharomyces Ferment, Cryptomeria Japonica Leaf Extract, Nelumbo Nucifera Leaf Extract, Pinus Palustris Leaf Extract, Ulmus Davidiana Root Extract, Oenothera Biennis Flower Extract, Pueraria Lobata Root Extract, Melaleuca Alternifolia Leaf Oil, Allantoin, Betaine Salicylate, Citric Acid, Ethylhexylglycerin, 1,2-Hexanediol' },
      { name: 'Pimple Clear Face Wash', brand: 'Himalaya', category: 'Cleanser', inci: 'Water, Sodium Laureth Sulfate, Acrylates Copolymer, Cocamidopropyl Betaine, Glycerin, Neem Leaf Extract, Turmeric Extract, Sodium Chloride, DMDM Hydantoin, Disodium EDTA, Citric Acid' },
      { name: 'Oil Cleanser', brand: 'DHC', category: 'Cleanser', inci: 'Olea Europaea Fruit Oil, Caprylic/Capric Triglyceride, Sorbeth-30 Tetraoleate, Pentylene Glycol, Phenoxyethanol, Tocopherol, Stearyl Glycyrrhetinate, Rosmarinus Officinalis Leaf Oil' },

      // Additional Moisturizers
      { name: 'Dramatically Different Moisturizing Lotion+', brand: 'Clinique', category: 'Moisturizer', inci: 'Water, Mineral Oil, Glycerin, Petrolatum, Stearic Acid, Glyceryl Stearate, Sesame Oil, Serica, Sodium Hyaluronate, Tocopheryl Acetate, Triticum Vulgare Germ Oil, Helianthus Annuus Seed Oil, Butylene Glycol, Cetyl Alcohol, Pentaerythrityl Tetraethylhexanoate, Triethanolamine, Dimethicone, Phenoxyethanol, Carbomer, Disodium EDTA' },
      { name: 'Aqua Bomb', brand: 'Belif', category: 'Moisturizer', inci: 'Water, Dipropylene Glycol, Glycerin, Betula Platyphylla Japonica Juice, Dimethicone, Glyceryl Stearate, Neopentyl Glycol Diheptanoate, Stearic Acid, Cetyl Alcohol, PEG-100 Stearate, 1,2-Hexanediol, Batyl Alcohol, Bis-PEG-18 Methyl Ether Dimethyl Silane, Polyglyceryl-3 Methylglucose Distearate, Dimethicone/Vinyl Dimethicone Crosspolymer, Carbomer, Sodium Acrylate/Sodium Acryloyldimethyl Taurate Copolymer, Xanthan Gum, Fragrance' },
      { name: 'Water Cream', brand: 'Tatcha', category: 'Moisturizer', inci: 'Water, Glycerin, Diphenylsiloxy Phenyl Trimethicone, Butylene Glycol, Dimethicone, Vinyl Dimethicone/Methicone Silsesquioxane Crosspolymer, Pentylene Glycol, Sodium Hyaluronate, Camellia Sinensis Leaf Extract, Oryza Sativa Bran Extract, Algae Extract, Sophora Angustifolia Root Extract, Chondrus Crispus Extract, Sodium Chloride, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Sodium Hydroxide, BHT, Tocopherol, Phenoxyethanol, Ethylhexylglycerin' },
      { name: 'Moisturizing Gel Cream', brand: 'Neutrogena Hydro Boost', category: 'Moisturizer', inci: 'Water, Dimethicone, Glycerin, Dimethicone/Vinyl Dimethicone Crosspolymer, Phenoxyethanol, Cetearyl Olivate, Sorbitan Olivate, Synthetic Beeswax, Polyacrylamide, C13-14 Isoparaffin, Dimethiconol, Carbomer, Laureth-7, Sodium Hyaluronate, Ethylhexylglycerin, C12-14 Pareth-12, Sodium Hydroxide' },
      { name: 'Skin Relieving Moisturizing Cream', brand: 'Eucerin', category: 'Moisturizer', inci: 'Water, Glycerin, Caprylic/Capric Triglyceride, Cetyl Alcohol, Dimethicone, Glyceryl Stearate SE, Helianthus Annuus Seed Oil, Octyldodecanol, Ceramide NP, Panthenol, Glycyrrhiza Inflata Root Extract, Methylpropanediol, Licochalcone A, Sodium Carbomer, Trisodium EDTA, 1,2-Hexanediol, Phenoxyethanol' },
      { name: 'Barrier Repair Moisturizer', brand: 'Krave Beauty', category: 'Moisturizer', inci: 'Water, Squalane, Pentaerythrityl Tetraethylhexanoate, Glycerin, Butylene Glycol, Cetearyl Alcohol, 1,2-Hexanediol, Polymethylsilsesquioxane, Cetearyl Olivate, Sorbitan Olivate, Sodium Hyaluronate, Ceramide NP, Panthenol, Allantoin, Camellia Sinensis Leaf Extract, Dimethicone, Carbomer, Xanthan Gum, Ethylhexylglycerin, Disodium EDTA' },
      { name: 'Ultra Facial Cream', brand: "Kiehl's", category: 'Moisturizer', inci: 'Water, Squalane, Glycerin, Dicaprylyl Carbonate, Sucrose Stearate, Stearyl Alcohol, Glyceryl Stearate, PEG-100 Stearate, Prunus Armeniaca Kernel Oil, Bis-PEG-12 Dimethicone Beeswax, Phenoxyethanol, Carbomer, Olea Europaea Fruit Oil, Caprylyl Glycol, Sodium Hydroxide, Tocopherol, Chlorphenesin, Disodium EDTA, Prunus Persica Kernel Oil' },

      // Sunscreens
      { name: 'Ultra Light Invisible Fluid SPF 60', brand: 'La Roche-Posay Anthelios', category: 'Sunscreen', inci: 'Water, Homosalate, Silica, Alcohol Denat., Octocrylene, Butyl Methoxydibenzoylmethane, Ethylhexyl Triazone, Drometrizole Trisiloxane, Glycerin, Diisopropyl Sebacate, Dimethicone, Styrene/Acrylates Copolymer, Tocopherol, Disodium EDTA, Caprylyl Glycol, Sodium Chloride, Phenoxyethanol' },
      { name: 'Mineral Body Sunscreen SPF 50', brand: 'CeraVe', category: 'Sunscreen', inci: 'Titanium Dioxide 6.5%, Zinc Oxide 4.9%, Water, C12-15 Alkyl Benzoate, Glycerin, Dimethicone, Niacinamide, Cetearyl Alcohol, Ceramide NP, Ceramide AP, Ceramide EOP, Carbomer, Sodium Lauroyl Lactylate, Cholesterol, Phytosphingosine, Phenoxyethanol, Disodium EDTA, Tocopherol, Xanthan Gum, Ethylhexylglycerin' },
      { name: 'Unseen Sunscreen SPF 40', brand: 'Supergoop', category: 'Sunscreen', inci: 'Avobenzone 3%, Homosalate 8%, Octisalate 5%, Octocrylene 4%, Dimethicone, Dimethicone/Bis-Isobutyl PPG-20 Crosspolymer, C12-15 Alkyl Benzoate, Dimethicone Crosspolymer, Isododecane, Meadowfoam Estolide, Silica, Dimethicone/Vinyl Dimethicone Crosspolymer, Polyglyceryl-4 Diisostearate/Polyhydroxystearate/Sebacate, Tocopherol, Butyloctyl Salicylate, Ethylhexylglycerin, Phenoxyethanol, Triethoxycaprylylsilane' },
      { name: 'Every Day Moisturizer SPF 15', brand: 'Cetaphil', category: 'Sunscreen', inci: 'Avobenzone 3%, Octisalate 5%, Octocrylene 7%, Water, Glycerin, Diisopropyl Adipate, Cyclopentasiloxane, Polyacrylamide, C13-14 Isoparaffin, Dimethicone, Cetearyl Alcohol, Laureth-7, PEG-100 Stearate, Glyceryl Stearate, Panthenol, Tocopheryl Acetate, Sodium Hyaluronate, Phenoxyethanol, Benzyl Alcohol, Citric Acid, Disodium EDTA' },

      // Serums & Treatments
      { name: 'Vitamin C Serum (C E Ferulic)', brand: 'SkinCeuticals', category: 'Serum', inci: 'Water, Ethoxydiglycol, Ascorbic Acid, Glycerin, Propylene Glycol, Laureth-23, Alpha-Tocopherol, Panthenol, Ferulic Acid, Sodium Hyaluronate, Triethanolamine, Phenoxyethanol' },
      { name: 'Advanced Retinol Serum', brand: 'Neutrogena Rapid Wrinkle Repair', category: 'Serum', inci: 'Water, Dimethicone, Glycerin, Isohexadecane, Retinol, Hyaluronic Acid, Glucose, Dimethicone Crosspolymer, Polysorbate 20, Chrysanthemum Parthenium Extract, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Sodium Hydroxide, BHT, Phenoxyethanol, Ethylhexylglycerin, Disodium EDTA' },
      { name: 'Buffet Multi-Technology Peptide Serum', brand: 'The Ordinary', category: 'Serum', inci: 'Water, Glycerin, Lactococcus Ferment Lysate, Acetyl Hexapeptide-8, Pentapeptide-18, Palmitoyl Tripeptide-1, Palmitoyl Tetrapeptide-7, Palmitoyl Tripeptide-38, Dipeptide Diaminobutyroyl Benzylamide Diacetate, Acetylarginyltryptophyl Diphenylglycine, Sodium Hyaluronate Crosspolymer, Sodium Hyaluronate, Allantoin, Glycine, Alanine, Serine, Valine, Isoleucine, Proline, Threonine, Histidine, Phenylalanine, Arginine, Aspartic Acid, Trehalose, Pentylene Glycol, Propanediol, PPG-26-Buteth-26, PEG-40 Hydrogenated Castor Oil, Trisodium Ethylenediamine Disuccinate, Citric Acid, Polysorbate 20, Sodium Benzoate, Potassium Sorbate, Ethylhexylglycerin, Phenoxyethanol, Chlorphenesin' },
      { name: 'Retinol 0.5% in Squalane', brand: 'The Ordinary', category: 'Serum', inci: 'Squalane, Caprylic/Capric Triglyceride, Retinol, Solanum Lycopersicum Fruit Extract, Simmondsia Chinensis Seed Oil, BHT, Rosmarinus Officinalis Leaf Extract' },
      { name: 'Snail Truecica Miracle Repair Serum', brand: 'Some By Mi', category: 'Serum', inci: 'Snail Secretion Filtrate, Water, Dipropylene Glycol, Glycerin, Niacinamide, Betaine, 1,2-Hexanediol, Centella Asiatica Extract, Panthenol, Madecassoside, Allantoin, Sodium Hyaluronate, Adenosine, Ethylhexylglycerin, Carbomer, Arginine, Disodium EDTA' },
      { name: 'Vitamin C Serum', brand: 'TruSkin', category: 'Serum', inci: 'Water, Sodium Ascorbyl Phosphate, Botanical Hyaluronic Acid, Witch Hazel, Aloe Barbadensis Leaf Juice, Jojoba Oil, Glycerin, Vitamin E, Ferulic Acid, Organic Rose Hip Oil, Sea Buckthorn Oil, Dimethyl Sulfone, Phenoxyethanol, Ethylhexylglycerin' },

      // K-Beauty Additions
      { name: 'Centella Unscented Serum', brand: 'Purito', category: 'Serum', inci: 'Water, Centella Asiatica Extract, Butylene Glycol, Glycerin, 1,2-Hexanediol, Betaine, Centella Asiatica Leaf Extract, Asiaticoside, Asiatic Acid, Madecassic Acid, Madecassoside, Dipropylene Glycol, Carbomer, Arginine, Dimethicone, Panthenol, Sodium Hyaluronate, Allantoin, Ethylhexylglycerin' },
      { name: 'Cica Balm', brand: 'Dr. Jart+', category: 'Moisturizer', inci: 'Water, Glycerin, Butylene Glycol, Dimethicone, Niacinamide, Cetyl Ethylhexanoate, 1,2-Hexanediol, Cetearyl Alcohol, Sorbitan Stearate, Centella Asiatica Extract, Madecassoside, Asiaticoside, Allantoin, Sodium Hyaluronate, Carbomer, Arginine, Disodium EDTA, Phenoxyethanol, Ethylhexylglycerin' },
      { name: 'Rice Toner', brand: 'Im From', category: 'Toner', inci: 'Oryza Sativa (Rice) Extract, Water, Methylpropanediol, Glycerin, Niacinamide, Betaine, 1,2-Hexanediol, Allantoin, Ethylhexylglycerin, Carbomer, Arginine, Disodium EDTA' },
      { name: 'AHA/BHA Clarifying Treatment Toner', brand: 'COSRX', category: 'Toner', inci: 'Salix Alba (Willow) Bark Water, Pyrus Malus (Apple) Fruit Water, Butylene Glycol, Glycolic Acid, Betaine Salicylate, Water, Niacinamide, Sodium Hyaluronate, Allantoin, Panthenol, Ethyl Hexanediol, 1,2-Hexanediol' },

      // Drugstore/Affordable
      { name: 'Moisturizing Cream', brand: 'Cetaphil', category: 'Moisturizer', inci: 'Water, Glycerin, Petrolatum, Dicaprylyl Ether, Dimethicone, Glyceryl Stearate, Cetyl Alcohol, PEG-30 Stearate, Prunus Amygdalus Dulcis Oil, Dimethiconol, Phenoxyethanol, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Benzyl Alcohol, Citric Acid, Disodium EDTA, Panthenol, Niacinamide, Sodium Hyaluronate, Tocopheryl Acetate' },
      { name: 'Moisturizing Lotion', brand: 'Cetaphil', category: 'Moisturizer', inci: 'Water, Glycerin, Hydrogenated Polyisobutene, Cetearyl Alcohol, Ceteareth-20, Macadamia Integrifolia Seed Oil, Dimethicone, Tocopheryl Acetate, Potassium Phosphate, Panthenol, Niacinamide, Glyceryl Stearate, PEG-100 Stearate, Benzyl Alcohol, Sodium Hyaluronate, Citric Acid, Dipotassium Phosphate, Disodium EDTA, Phenoxyethanol' },
      { name: 'Acne Control Cleanser 2% Salicylic Acid', brand: 'PanOxyl', category: 'Cleanser', inci: 'Salicylic Acid 2%, Water, Sodium C14-16 Olefin Sulfonate, Cocamidopropyl Betaine, Glycerin, Acrylates Copolymer, Sodium Chloride, Aloe Barbadensis Leaf Juice, Ceramide NP, Sodium Hydroxide, Citric Acid, Disodium EDTA, Phenoxyethanol' },
      { name: 'Acne Foaming Cream Cleanser', brand: 'PanOxyl', category: 'Cleanser', inci: 'Benzoyl Peroxide 10%, Water, Glycerin, Sodium C14-16 Olefin Sulfonate, Acrylates Copolymer, Zinc Lactate, Cocamidopropyl Betaine, Sodium Methyl Cocoyl Taurate, Sodium Chloride, Sodium Hydroxide, Disodium EDTA' },

      // Popular Body Care
      { name: 'Rough & Bumpy Daily Skin Smoothing Lotion', brand: 'AmLactin', category: 'Body', inci: 'Water, Ammonium Lactate, Cetearyl Alcohol, Glycerin, Mineral Oil, Glyceryl Stearate, PEG-100 Stearate, Magnesium Aluminum Silicate, Laureth-4, Methylcellulose, Methylparaben, Propylparaben' },
      { name: 'Daily Moisturizing Body Wash', brand: 'Dove', category: 'Body Wash', inci: 'Water, Sodium Lauroyl Isethionate, Cocamidopropyl Betaine, Sodium Laureth Sulfate, Sodium Isethionate, Glycerin, Stearic Acid, Sodium Chloride, Sodium Stearate, Lauric Acid, Guar Hydroxypropyltrimonium Chloride, Sodium Hydroxide, Tetrasodium EDTA, Citric Acid, BHT' },
      { name: 'Intensive Repair Body Lotion', brand: 'Vaseline', category: 'Body', inci: 'Water, Glycerin, Stearic Acid, Isopropyl Palmitate, Glycol Stearate, Petrolatum, Glyceryl Stearate, Dimethicone, Cetyl Alcohol, Tapioca Starch, Stearamidopropyl PG-Dimonium Chloride Phosphate, Oat Extract, Tocopheryl Acetate, Stearyl Alcohol, Sodium Hydroxide, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Disodium EDTA, DMDM Hydantoin, Phenoxyethanol, Iodopropynyl Butylcarbamate' },
    ];

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    function normalize(str) {
      return str.toLowerCase().replace(/\s+/g, ' ').replace(/[.]/g, '').trim();
    }

    function stripParenthetical(str) {
      return str.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    }

    function levenshtein(a, b) {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      const matrix = [];
      for (let i = 0; i <= b.length; i++) matrix[i] = [i];
      for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[b.length][a.length];
    }

    function parseINCI(raw) {
      return raw
        .split(/,|\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    function matchIngredient(input) {
      const norm = normalize(input);
      const stripped = normalize(stripParenthetical(input));

      // Check unsafe
      for (const entry of UNSAFE) {
        for (const name of entry.names) {
          const n = normalize(name);
          if (norm === n || stripped === n) return { ...entry, severity: 'unsafe', matched: name };
          if (norm.includes(n) || n.includes(norm)) return { ...entry, severity: 'unsafe', matched: name };
        }
      }

      // Check caution
      for (const entry of CAUTION) {
        for (const name of entry.names) {
          const n = normalize(name);
          if (norm === n || stripped === n) return { ...entry, severity: 'caution', matched: name };
          if (norm.includes(n) || n.includes(norm)) return { ...entry, severity: 'caution', matched: name };
        }
      }

      // Check safe
      for (const entry of SAFE) {
        for (const name of entry.names) {
          const n = normalize(name);
          if (norm === n || stripped === n) return { severity: 'safe', matched: name };
          if (norm.includes(n) || n.includes(norm)) return { severity: 'safe', matched: name };
        }
      }

      // Fuzzy match for short names (levenshtein)
      const allEntries = [...UNSAFE.map(e => ({ ...e, severity: 'unsafe' })), ...CAUTION.map(e => ({ ...e, severity: 'caution' }))];
      for (const entry of allEntries) {
        for (const name of entry.names) {
          const n = normalize(name);
          if (n.length > 5 && norm.length > 5 && levenshtein(norm, n) <= 2) {
            return { ...entry, matched: name };
          }
        }
      }

      return { severity: 'unknown' };
    }

    function analyzeIngredients(inciList) {
      const results = { unsafe: [], caution: [], safe: [], unknown: [], total: inciList.length };

      for (let i = 0; i < inciList.length; i++) {
        const ingredient = inciList[i];
        const match = matchIngredient(ingredient);
        match.original = ingredient;
        match.position = i + 1;
        // Concentration estimate: ingredients listed first are at higher concentration
        // Top 5 = high, 6-15 = medium, 16+ = low
        match.concentration = i < 5 ? 'high' : (i < 15 ? 'medium' : 'low');
        match.concentrationPct = Math.max(5, Math.round(100 - (i / inciList.length) * 100));

        if (match.severity === 'unsafe') results.unsafe.push(match);
        else if (match.severity === 'caution') results.caution.push(match);
        else if (match.severity === 'safe') results.safe.push(match);
        else results.unknown.push(match);
      }

      // Weighted score: ingredients higher in the list penalize more
      let penalty = 0;
      results.unsafe.forEach(m => {
        const weight = m.concentration === 'high' ? 3 : (m.concentration === 'medium' ? 2 : 1);
        penalty += weight;
      });
      results.caution.forEach(m => {
        const weight = m.concentration === 'high' ? 1.5 : (m.concentration === 'medium' ? 1 : 0.5);
        penalty += weight;
      });
      const maxPenalty = results.total * 3;
      const score = results.total > 0 ? Math.round((1 - penalty / maxPenalty) * 100) : 100;

      let verdict = 'safe';
      if (results.unsafe.length > 0) verdict = 'unsafe';
      else if (results.caution.length > 0) verdict = 'caution';

      return { ...results, score: Math.max(0, Math.min(100, score)), verdict, flaggedCount: results.unsafe.length + results.caution.length };
    }

    // ==========================================
    // DEVICE ID & SUPABASE
    // ==========================================
    function getDeviceId() {
      let id = localStorage.getItem('kyn_device_id');
      if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
        localStorage.setItem('kyn_device_id', id);
      }
      return id;
    }

    const deviceId = getDeviceId();

    async function supabaseRequest(method, table, data, filters) {
      const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
      if (filters) {
        for (const [key, val] of Object.entries(filters)) {
          url.searchParams.set(key, val);
        }
      }
      // For PATCH/DELETE, add device_id + id filters from data._match_id
      if ((method === 'PATCH' || method === 'DELETE') && data && data._match_id) {
        url.searchParams.set('id', `eq.${data._match_id}`);
        url.searchParams.set('device_id', `eq.${deviceId}`);
        const { _match_id, ...cleanData } = data;
        data = cleanData;
      }
      const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : (method === 'GET' ? '' : 'return=minimal')
      };
      if (!headers['Prefer']) delete headers['Prefer'];
      const opts = { method, headers };
      if (data && method !== 'GET') opts.body = JSON.stringify(data);
      try {
        const res = await fetch(url.toString(), opts);
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`${res.status}: ${errText}`);
        }
        const text = await res.text();
        if (!text) return method === 'DELETE' ? null : [];
        return JSON.parse(text);
      } catch (e) {
        console.warn('Supabase error, falling back to localStorage:', e);
        return localStorageFallback(method, table, data, filters);
      }
    }

    // localStorage fallback
    function localStorageFallback(method, table, data) {
      const key = `kyn_${table}`;
      let items = [];
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) items = parsed;
      } catch (_) {
        localStorage.removeItem(key);
      }

      if (method === 'GET') return items.filter(i => i.device_id === deviceId);
      if (method === 'POST') {
        const item = { ...data, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36), created_at: new Date().toISOString() };
        items.push(item);
        localStorage.setItem(key, JSON.stringify(items));
        return [item];
      }
      if (method === 'PATCH') {
        items = items.map(i => {
          if (i.device_id === deviceId && i.id === data._match_id) {
            const { _match_id, ...rest } = data;
            return { ...i, ...rest };
          }
          return i;
        });
        localStorage.setItem(key, JSON.stringify(items));
        return [];
      }
      if (method === 'DELETE') {
        items = items.filter(i => !(i.device_id === deviceId && i.id === data._match_id));
        localStorage.setItem(key, JSON.stringify(items));
        return null;
      }
      return [];
    }

    // ==========================================
    // STATE
    // ==========================================
    let currentAnalysis = null;
    let currentProductName = '';
    let currentProductBrand = '';
    let currentInci = '';
    let savedProducts = [];

    // ==========================================
    // DOM REFERENCES
    // ==========================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ==========================================
    // TABS
    // ==========================================
    $$('.checker__tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.checker__tab').forEach(t => t.classList.remove('active'));
        $$('.checker__panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        $(`#panel-${tab.dataset.tab}`).classList.add('active');
      });
    });

    // ==========================================
    // CHECK INGREDIENTS
    // ==========================================
    function runCheck(inci, productName, brand, skipScroll) {
      const ingredients = parseINCI(inci);
      if (ingredients.length === 0) return;

      currentInci = inci;
      currentProductName = productName || '';
      currentProductBrand = brand || '';
      currentAnalysis = analyzeIngredients(ingredients);

      renderResults(currentAnalysis, productName);
      loadRatings();

      const resultsEl = $('#results');
      resultsEl.classList.add('visible');
      if (!skipScroll) resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Update URL for sharing (encode product name + first 200 chars of INCI)
      try {
        const shareData = { n: productName || '', b: brand || '', i: inci.substring(0, 2000) };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(shareData))));
        history.replaceState(null, '', '#r=' + encoded);
      } catch (e) { /* ignore encoding errors */ }
    }

    // Read URL hash on page load to restore shared results
    function checkUrlHash() {
      const hash = window.location.hash;
      if (hash.startsWith('#r=')) {
        try {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(hash.substring(3)))));
          if (decoded.i) {
            $('#productName').value = decoded.n || '';
            $('#inciInput').value = decoded.i;
            runCheck(decoded.i, decoded.n, decoded.b, true);
          }
        } catch (e) { /* ignore bad hash */ }
      }
    }

    $('#checkBtn').addEventListener('click', () => {
      const inci = $('#inciInput').value.trim();
      const name = $('#productName').value.trim();
      if (!inci) return;
      runCheck(inci, name, '');
    });

    // Example
    $('#tryExample').addEventListener('click', () => {
      $('#productName').value = 'Example Moisturizer';
      $('#inciInput').value = 'Water, Glycerin, Coconut Oil, Cetearyl Alcohol, Niacinamide, Isopropyl Myristate, Dimethicone, Polysorbate 60, Shea Butter, Phenoxyethanol, Hyaluronic Acid, Tocopherol';
      $('#checkBtn').click();
    });

    // Check another product
    $('#checkAnotherBtn').addEventListener('click', () => {
      $('#productName').value = '';
      $('#inciInput').value = '';
      $('#results').classList.remove('visible');
      $('#checker').scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('#productName').focus();
    });

    // ==========================================
    // AUTOFILL / AUTOCOMPLETE (paste tab)
    // ==========================================
    const productNameInput = $('#productName');
    const autofillDropdown = $('#autofillDropdown');
    let autofillHighlight = -1;

    productNameInput.addEventListener('input', () => {
      const q = productNameInput.value.toLowerCase().trim();
      autofillDropdown.innerHTML = '';
      autofillHighlight = -1;

      if (q.length < 2) { autofillDropdown.classList.remove('open'); return; }

      const matches = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        `${p.brand} ${p.name}`.toLowerCase().includes(q)
      ).slice(0, 8);

      if (matches.length === 0) { autofillDropdown.classList.remove('open'); return; }

      matches.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'checker__dropdown-item';
        div.dataset.index = i;
        div.innerHTML = `
          <div>
            <div class="checker__dropdown-name">${p.brand} ${p.name}</div>
            <div class="checker__dropdown-brand">${p.category}</div>
          </div>
          <span class="checker__dropdown-cat">Auto-fill</span>
        `;
        div.addEventListener('click', () => {
          productNameInput.value = `${p.brand} ${p.name}`;
          $('#inciInput').value = p.inci;
          autofillDropdown.classList.remove('open');
          currentProductBrand = p.brand;
        });
        autofillDropdown.appendChild(div);
      });

      autofillDropdown.classList.add('open');
    });

    productNameInput.addEventListener('keydown', (e) => {
      const items = autofillDropdown.querySelectorAll('.checker__dropdown-item');
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        autofillHighlight = Math.min(autofillHighlight + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle('highlighted', i === autofillHighlight));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        autofillHighlight = Math.max(autofillHighlight - 1, 0);
        items.forEach((el, i) => el.classList.toggle('highlighted', i === autofillHighlight));
      } else if (e.key === 'Enter' && autofillHighlight >= 0) {
        e.preventDefault();
        items[autofillHighlight].click();
      } else if (e.key === 'Escape') {
        autofillDropdown.classList.remove('open');
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.checker__autocomplete')) autofillDropdown.classList.remove('open');
    });

    // ==========================================
    // PRODUCT SEARCH (with category filter)
    // ==========================================
    const searchInput = $('#searchInput');
    const searchResults = $('#searchResults');
    let activeCategory = 'all';

    // Category filter buttons
    $$('.checker__cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.checker__cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.cat;
        renderSearchResults();
      });
    });

    function renderSearchResults() {
      const q = searchInput.value.toLowerCase().trim();
      searchResults.innerHTML = '';

      let pool = PRODUCTS;
      if (activeCategory !== 'all') {
        pool = pool.filter(p => p.category === activeCategory);
      }

      // If no query but category is selected, show all in that category
      if (q.length < 2 && activeCategory === 'all') return;

      const matches = q.length >= 2
        ? pool.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            `${p.brand} ${p.name}`.toLowerCase().includes(q)
          ).slice(0, 15)
        : pool.slice(0, 15);

      matches.forEach(p => {
        const div = document.createElement('div');
        div.className = 'checker__search-item';
        div.innerHTML = `
          <div>
            <div class="checker__search-item-name">${p.brand} ${p.name}</div>
            <div class="checker__search-item-brand">${p.inci.substring(0, 60)}...</div>
          </div>
          <span class="checker__search-item-category">${p.category}</span>
        `;
        div.addEventListener('click', () => {
          runCheck(p.inci, p.name, p.brand);
        });
        searchResults.appendChild(div);
      });

      if (matches.length === 0) {
        searchResults.innerHTML = '<p style="padding:1rem;opacity:0.4;font-size:0.85rem;">No products found. Try pasting ingredients instead.</p>';
      }
    }

    searchInput.addEventListener('input', renderSearchResults);

    // ==========================================
    // CAMERA / OCR
    // ==========================================
    $('#scanBtn').addEventListener('click', () => {
      $('#cameraInput').click();
    });

    $('#cameraInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const preview = $('#scanPreview');
      const status = $('#scanStatus');
      const img = $('#scanImage');

      // Show preview
      const reader = new FileReader();
      reader.onload = async (ev) => {
        img.src = ev.target.result;
        preview.style.display = 'block';
        status.textContent = 'Reading ingredients...';

        const base64 = ev.target.result.split(',')[1];

        try {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/ocr`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ image: base64 })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'OCR request failed');
          const text = data.text || '';

          if (!text) {
            status.textContent = 'Could not read text from image. Try a clearer photo.';
            return;
          }

          // Clean OCR text: normalize line breaks into commas
          const cleaned = text
            .replace(/\n/g, ', ')
            .replace(/,,+/g, ',')
            .replace(/(ingredients|active ingredients|inactive ingredients)\s*[:;,]?\s*/gi, '')
            .trim();

          // Switch to paste tab and fill in
          $$('.checker__tab').forEach(t => t.classList.remove('active'));
          $$('.checker__panel').forEach(p => p.classList.remove('active'));
          $$('.checker__tab')[0].classList.add('active');
          $('#panel-paste').classList.add('active');
          $('#inciInput').value = cleaned;
          status.textContent = 'Ingredients extracted! Review and click Check.';

        } catch (err) {
          status.textContent = 'Error reading image. Please try again.';
          console.error('OCR error:', err);
        }
      };
      reader.readAsDataURL(file);
    });

    // ==========================================
    // RENDER RESULTS
    // ==========================================
    function renderResults(analysis, productName) {
      // Product name
      const label = productName ? `${currentProductBrand ? currentProductBrand + ' ' : ''}${productName}` : '';
      $('#resultsProductName').textContent = label;

      // Verdict card
      const card = $('#verdictCard');
      card.className = `results__verdict results__verdict--${analysis.verdict}`;

      const ring = $('#scoreRing');
      ring.className = `results__score-ring results__score-ring--${analysis.verdict}`;
      ring.textContent = analysis.score;

      const verdictLabel = $('#verdictLabel');
      verdictLabel.className = `results__verdict-label results__verdict-label--${analysis.verdict}`;
      const labels = { safe: 'Malassezia Safe', caution: 'Use With Caution', unsafe: 'Not Malassezia Safe' };
      verdictLabel.textContent = labels[analysis.verdict];

      const descs = {
        safe: 'Good news! We didn\'t find any ingredients known to feed Malassezia. This product looks safe for fungal acne, seb derm, and other Malassezia-prone skin.',
        caution: 'This product is mostly fine, but has some ingredients that bother some people with Malassezia-prone skin. Try it carefully and watch how your skin reacts.',
        unsafe: `We found ${analysis.unsafe.length} ingredient${analysis.unsafe.length > 1 ? 's' : ''} that can feed Malassezia — the yeast behind fungal acne, seb derm, and dandruff. Scroll down to see which ones and what to use instead.`
      };
      $('#verdictDesc').textContent = descs[analysis.verdict];

      // Save button state
      const saveBtn = $('#saveProductBtn');
      const alreadySaved = savedProducts.some(p => p.inci_list === currentInci);
      saveBtn.textContent = alreadySaved ? 'Saved' : 'Save Product';
      saveBtn.className = `results__save-btn${alreadySaved ? ' saved' : ''}`;

      // Stats
      const statsRow = $('#statsRow');
      statsRow.innerHTML = `
        <div class="results__stat animate" style="opacity:0">
          <div class="results__stat-num">${analysis.total}</div>
          <div class="results__stat-label">Total Ingredients</div>
        </div>
        <div class="results__stat animate" style="opacity:0">
          <div class="results__stat-num" style="color:var(--unsafe-red)">${analysis.unsafe.length}</div>
          <div class="results__stat-label">Unsafe</div>
        </div>
        <div class="results__stat animate" style="opacity:0">
          <div class="results__stat-num" style="color:var(--caution-amber)">${analysis.caution.length}</div>
          <div class="results__stat-label">Caution</div>
        </div>
        <div class="results__stat animate" style="opacity:0">
          <div class="results__stat-num" style="color:var(--safe-green)">${analysis.safe.length}</div>
          <div class="results__stat-label">Safe</div>
        </div>
      `;

      // Flagged
      const flaggedSection = $('#flaggedSection');
      const flaggedGrid = $('#flaggedGrid');
      const flagged = [...analysis.unsafe, ...analysis.caution];

      // Animate score ring
      ring.classList.remove('animate');
      void ring.offsetWidth;
      ring.classList.add('animate');

      // Animate score number counting up
      let displayScore = 0;
      const targetScore = analysis.score;
      const scoreInterval = setInterval(() => {
        displayScore += Math.ceil(targetScore / 20);
        if (displayScore >= targetScore) { displayScore = targetScore; clearInterval(scoreInterval); }
        ring.textContent = displayScore;
      }, 30);

      // Share link (use current URL which now includes #r= hash)
      const shareText = `${label || 'This product'} scored ${analysis.score}/100 on the Malassezia-Safe Ingredient Checker by @kynskyn`;
      const shareUrl = window.location.href;
      $('#shareTwitter').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

      if (flagged.length > 0) {
        flaggedSection.style.display = 'block';
        flaggedGrid.innerHTML = flagged.map((item, i) => `
          <div class="ingredient-card ingredient-card--${item.severity} animate" style="animation-delay:${i * 0.08}s">
            <div class="ingredient-card__position${item.concentration === 'high' ? ' ingredient-card__position--high' : ''}">#${item.position} in list${item.concentration === 'high' ? ' — high concentration' : item.concentration === 'medium' ? ' — medium concentration' : ''}</div>
            <div class="ingredient-card__concentration-bar"><div class="ingredient-card__concentration-fill ingredient-card__concentration-fill--${item.concentration}" style="width:${item.concentrationPct}%"></div></div>
            <span class="ingredient-card__badge ingredient-card__badge--${item.severity}">${item.severity}</span>
            <div class="ingredient-card__name">${item.original}</div>
            <div class="ingredient-card__reason">${item.reason}</div>
            <div class="ingredient-card__alt"><strong>Try instead:</strong> ${item.alternative}</div>
          </div>
        `).join('');
      } else {
        flaggedSection.style.display = 'none';
      }

      // Safe
      const safeSection = $('#safeSection');
      const safeList = $('#safeList');
      if (analysis.safe.length > 0) {
        safeSection.style.display = 'block';
        safeList.innerHTML = analysis.safe.map(item => `
          <span class="results__safe-chip">${item.original}</span>
        `).join('');
      } else {
        safeSection.style.display = 'none';
      }

      // Unknown
      const unknownSection = $('#unknownSection');
      const unknownList = $('#unknownList');
      if (analysis.unknown.length > 0) {
        unknownSection.style.display = 'block';
        unknownList.innerHTML = analysis.unknown.map(item => `
          <span class="results__unknown-chip">${item.original}</span>
        `).join('');
      } else {
        unknownSection.style.display = 'none';
      }
    }

    // ==========================================
    // SAVE PRODUCT
    // ==========================================
    $('#saveProductBtn').addEventListener('click', async () => {
      if (!currentAnalysis || !currentInci) return;

      const btn = $('#saveProductBtn');
      if (btn.classList.contains('saved')) return;

      const product = {
        device_id: deviceId,
        product_name: currentProductName || 'Unnamed Product',
        brand: currentProductBrand || '',
        inci_list: currentInci,
        safety_score: currentAnalysis.score,
        unsafe_count: currentAnalysis.unsafe.length,
        caution_count: currentAnalysis.caution.length,
        routine_slot: null,
        is_prebuilt: false
      };

      const result = await supabaseRequest('POST', 'saved_products', product);
      if (result && result[0]) {
        savedProducts.push(result[0]);
      } else {
        savedProducts.push(product);
      }

      btn.textContent = 'Saved';
      btn.classList.add('saved');

      renderRoutine();
    });

    // ==========================================
    // ROUTINE
    // ==========================================
    function renderRoutine() {
      const routineSection = $('#routine');
      const amContainer = $('#amRoutine');
      const pmContainer = $('#pmRoutine');
      const scoreEl = $('#routineScore');
      const unassignedContainer = $('#unassignedSection');

      // Show routine section only when there are saved products
      if (savedProducts.length > 0) {
        routineSection.style.display = 'block';
      } else {
        routineSection.style.display = 'none';
        return;
      }

      const amProducts = savedProducts.filter(p => p.routine_slot === 'am' || p.routine_slot === 'both');
      const pmProducts = savedProducts.filter(p => p.routine_slot === 'pm' || p.routine_slot === 'both');

      // SVG icons for card tops
      const icons = {
        safe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        caution: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        unsafe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      };

      const verdictLabels = { safe: 'Safe', caution: 'Caution', unsafe: 'Unsafe' };

      function buildCard(p) {
        const status = p.unsafe_count > 0 ? 'unsafe' : (p.caution_count > 0 ? 'caution' : 'safe');
        const flaggedText = p.unsafe_count > 0
          ? `${p.unsafe_count} unsafe ingredient${p.unsafe_count > 1 ? 's' : ''}`
          : (p.caution_count > 0 ? `${p.caution_count} debated ingredient${p.caution_count > 1 ? 's' : ''}` : 'No flagged ingredients');

        return `
          <div class="routine__card">
            <div class="routine__card-top routine__card-top--${status}">
              <div class="routine__card-icon routine__card-icon--${status}">${icons[status]}</div>
              <div class="routine__card-score routine__card-score--${status}">${p.safety_score}</div>
              <div class="routine__card-verdict">${verdictLabels[status]}</div>
            </div>
            <div class="routine__card-body">
              <div class="routine__card-name">${p.product_name}</div>
              <div class="routine__card-brand">${p.brand || ''}</div>
              <div class="routine__card-stats">${flaggedText}</div>
            </div>
            <div class="routine__card-action">
              <button class="routine__card-remove" data-id="${p.id}">Remove</button>
            </div>
          </div>
        `;
      }

      function renderCardRow(container, products) {
        if (products.length === 0) {
          container.innerHTML = '<div class="routine__empty">No products yet. Check a product and save it to add it here.</div>';
          return;
        }
        container.innerHTML = products.map(buildCard).join('');

        container.querySelectorAll('.routine__card-remove').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const product = savedProducts.find(p => p.id === id);
            if (product) {
              product.routine_slot = null;
              await supabaseRequest('PATCH', 'saved_products', { _match_id: id, device_id: deviceId, routine_slot: null });
              renderRoutine();
            }
          });
        });
      }

      renderCardRow(amContainer, amProducts);
      renderCardRow(pmContainer, pmProducts);

      // Overall score
      const allRoutineProducts = savedProducts.filter(p => p.routine_slot);
      if (allRoutineProducts.length > 0) {
        const avgScore = Math.round(allRoutineProducts.reduce((sum, p) => sum + (p.safety_score || 0), 0) / allRoutineProducts.length);
        const color = avgScore >= 80 ? 'var(--safe-green)' : (avgScore >= 50 ? 'var(--caution-amber)' : 'var(--unsafe-red)');
        scoreEl.textContent = `Overall: ${avgScore}/100`;
        scoreEl.style.background = color + '15';
        scoreEl.style.color = color;
      } else {
        scoreEl.textContent = '';
      }

      // Unassigned saved products
      const unassigned = savedProducts.filter(p => !p.routine_slot);
      if (unassigned.length > 0) {
        unassignedContainer.innerHTML = `
          <div class="routine__section">
            <p class="routine__column-title">Saved Products &mdash; Assign to Routine</p>
            <div class="routine__unassigned-row">
              ${unassigned.map(p => {
                const status = p.unsafe_count > 0 ? 'unsafe' : (p.caution_count > 0 ? 'caution' : 'safe');
                return `
                  <div class="routine__unassigned-card">
                    <div class="routine__card-icon routine__card-icon--${status}" style="margin-bottom:0.6rem;">${icons[status]}</div>
                    <div class="routine__unassigned-name">${p.product_name}</div>
                    <div class="routine__unassigned-brand">${p.brand || 'Score: ' + p.safety_score + '/100'}</div>
                    <div class="routine__assign-btns">
                      <button class="routine__assign-btn" data-id="${p.id}" data-slot="am">+ AM</button>
                      <button class="routine__assign-btn" data-id="${p.id}" data-slot="pm">+ PM</button>
                      <button class="routine__assign-btn" data-id="${p.id}" data-slot="both">+ Both</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;

        unassignedContainer.querySelectorAll('.routine__assign-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const slot = btn.dataset.slot;
            const product = savedProducts.find(p => p.id === id);
            if (product) {
              product.routine_slot = slot;
              await supabaseRequest('PATCH', 'saved_products', { _match_id: id, device_id: deviceId, routine_slot: slot });
              renderRoutine();
            }
          });
        });
      } else {
        unassignedContainer.innerHTML = '';
      }
    }

    // ==========================================
    // LOAD SAVED DATA
    // ==========================================
    async function loadSavedData() {
      try {
        const data = await supabaseRequest('GET', 'saved_products', null, { 'device_id': `eq.${deviceId}` });
        if (Array.isArray(data)) {
          savedProducts = data;
        }
      } catch (e) {
        console.warn('Could not load saved data:', e);
      }
      renderRoutine();
    }

    // ==========================================
    // FAQ ACCORDION
    // ==========================================
    $$('.faq__question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const isOpen = item.classList.contains('open');
        $$('.faq__item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });

    // ==========================================
    // COPY RESULTS
    // ==========================================
    $('#copyResultBtn').addEventListener('click', () => {
      if (!currentAnalysis) return;
      const btn = $('#copyResultBtn');
      const a = currentAnalysis;
      const label = currentProductName ? `${currentProductBrand ? currentProductBrand + ' ' : ''}${currentProductName}` : 'Product';

      const unsafeNames = a.unsafe.map(i => i.original).join(', ');
      const cautionNames = a.caution.map(i => i.original).join(', ');

      let text = `${label} — Malassezia Safety Score: ${a.score}/100\n`;
      text += `Verdict: ${a.verdict === 'safe' ? 'Safe' : a.verdict === 'caution' ? 'Caution' : 'Not Safe'}\n\n`;
      text += `Total: ${a.total} | Unsafe: ${a.unsafe.length} | Caution: ${a.caution.length} | Safe: ${a.safe.length}\n`;
      if (unsafeNames) text += `\nUnsafe: ${unsafeNames}`;
      if (cautionNames) text += `\nCaution: ${cautionNames}`;
      text += `\n\nChecked with Kyn Skyn Ingredient Checker: https://kynskyn.com/pages/ingredient-checker`;

      navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('copied');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Results';
        }, 2000);
      });
    });

    // ==========================================
    // COMPARE PRODUCTS
    // ==========================================
    function populateCompareSelects() {
      const allProducts = [...PRODUCTS.map(p => ({ ...p, source: 'prebuilt' })), ...savedProducts.filter(p => !p.is_prebuilt).map(p => ({ name: p.product_name, brand: p.brand || '', inci: p.inci_list, category: '', source: 'saved' }))];

      ['#compareSelect1', '#compareSelect2'].forEach(sel => {
        const select = $(sel);
        const currentVal = select.value;
        select.innerHTML = '<option value="">Select a product...</option>';
        allProducts.forEach((p, i) => {
          const opt = document.createElement('option');
          opt.value = i;
          opt.textContent = `${p.brand} ${p.name}`.trim();
          select.appendChild(opt);
        });
        select.value = currentVal;
        select._products = allProducts;
      });
    }

    $('#openCompareBtn').addEventListener('click', () => {
      populateCompareSelects();
      const compareEl = $('#compare');
      compareEl.classList.add('visible');
      compareEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $('#compareClose').addEventListener('click', () => {
      $('#compare').classList.remove('visible');
    });

    $('#compareGoBtn').addEventListener('click', () => {
      const sel1 = $('#compareSelect1');
      const sel2 = $('#compareSelect2');
      const idx1 = sel1.value;
      const idx2 = sel2.value;

      if (!idx1 || !idx2 || idx1 === idx2) return;

      const products = sel1._products;
      const p1 = products[parseInt(idx1)];
      const p2 = products[parseInt(idx2)];

      const a1 = analyzeIngredients(parseINCI(p1.inci));
      const a2 = analyzeIngredients(parseINCI(p2.inci));

      function statusClass(a) { return a.unsafe.length > 0 ? 'unsafe' : (a.caution.length > 0 ? 'caution' : 'safe'); }

      const grid = $('#compareGrid');
      grid.innerHTML = [
        { p: p1, a: a1 },
        { p: p2, a: a2 }
      ].map(({ p, a }) => `
        <div class="compare__product">
          <div class="compare__product-header compare__product-header--${statusClass(a)}">
            <div class="compare__product-score" style="color:var(--${statusClass(a) === 'safe' ? 'safe-green' : statusClass(a) === 'caution' ? 'caution-amber' : 'unsafe-red'})">${a.score}</div>
            <div class="compare__product-name">${p.name}</div>
            <div class="compare__product-brand">${p.brand}</div>
          </div>
          <div class="compare__product-body">
            <div class="compare__stat-row"><span class="compare__stat-label">Total ingredients</span><span>${a.total}</span></div>
            <div class="compare__stat-row"><span class="compare__stat-label">Unsafe</span><span style="color:var(--unsafe-red)">${a.unsafe.length}</span></div>
            <div class="compare__stat-row"><span class="compare__stat-label">Caution</span><span style="color:var(--caution-amber)">${a.caution.length}</span></div>
            <div class="compare__stat-row"><span class="compare__stat-label">Safe</span><span style="color:var(--safe-green)">${a.safe.length}</span></div>
            <div class="compare__stat-row"><span class="compare__stat-label">Unknown</span><span>${a.unknown.length}</span></div>
            ${a.unsafe.length > 0 ? `<div style="margin-top:0.8rem;font-size:0.75rem;color:var(--unsafe-red);opacity:0.8;">${a.unsafe.map(i => i.original).join(', ')}</div>` : ''}
          </div>
        </div>
      `).join('');

      // Winner
      const winner = $('#compareWinner');
      if (a1.score !== a2.score) {
        const w = a1.score > a2.score ? p1 : p2;
        winner.innerHTML = `
          <div class="compare__winner">
            <div class="compare__winner-label">Safer Choice</div>
            <div class="compare__winner-name">${w.brand} ${w.name}</div>
          </div>
        `;
      } else {
        winner.innerHTML = `
          <div class="compare__winner" style="background:rgba(100,18,32,0.04);border-color:rgba(100,18,32,0.1);">
            <div class="compare__winner-label" style="color:var(--maroon);opacity:0.5;">It's a Tie</div>
            <div class="compare__winner-name">Both products scored ${a1.score}/100</div>
          </div>
        `;
      }
    });

    // ==========================================
    // WAITLIST FORM
    // ==========================================
    const waitlistForm = $('#waitlistForm');
    if (waitlistForm) {
      waitlistForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = waitlistForm.querySelector('input[type="email"]').value.trim();
        if (!email) return;

        const btn = waitlistForm.querySelector('.notify__button');
        btn.disabled = true;
        btn.textContent = 'Sending...';

        try {
          const formData = new FormData();
          formData.append('form_type', 'customer');
          formData.append('utf8', '\u2713');
          formData.append('contact[email]', email);
          formData.append('contact[tags]', 'ingredient-checker,waitlist');

          await fetch('https://kynskyn.com/contact#contact_form', {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
          });

          localStorage.setItem('kyn_waitlist', 'true');
          btn.textContent = "You're in!";
          btn.style.background = '#2a6e3f';
          btn.style.borderColor = '#2a6e3f';
          $('#formSuccess').style.display = 'block';

          setTimeout(() => {
            btn.textContent = 'Notify Me';
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.disabled = false;
          }, 4000);
        } catch (err) {
          btn.textContent = 'Notify Me';
          btn.disabled = false;
          $('#formError').style.display = 'block';
        }
      });
    }

    // ==========================================
    // FADE-IN ANIMATIONS
    // ==========================================
    const fadeEls = $$('.fade-in');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0 });
    fadeEls.forEach(el => observer.observe(el));
    // Immediately show elements already in viewport on load
    requestAnimationFrame(() => {
      fadeEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add('visible');
      });
    });

    // ==========================================
    // COMMUNITY RATINGS
    // ==========================================
    function getProductKey() {
      // Create a simple key from product name + first 5 ingredients
      const name = (currentProductBrand + ' ' + currentProductName).trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const inciKey = currentInci.split(',').slice(0, 5).join(',').toLowerCase().trim();
      return name || inciKey.substring(0, 60);
    }

    async function loadRatings() {
      const key = getProductKey();
      if (!key) return;

      try {
        // Get counts
        const counts = await supabaseRequest('GET', 'product_rating_counts', null, { 'product_key': `eq.${key}` });
        if (counts && counts[0]) {
          $('#upCount').textContent = counts[0].upvotes || 0;
          $('#downCount').textContent = counts[0].downvotes || 0;
        } else {
          $('#upCount').textContent = '0';
          $('#downCount').textContent = '0';
        }

        // Check if this device already voted
        const myVote = await supabaseRequest('GET', 'product_ratings', null, {
          'product_key': `eq.${key}`,
          'device_id': `eq.${deviceId}`
        });
        $('#voteUpBtn').classList.remove('active-up');
        $('#voteDownBtn').classList.remove('active-down');
        if (myVote && myVote[0]) {
          if (myVote[0].vote === 'up') $('#voteUpBtn').classList.add('active-up');
          if (myVote[0].vote === 'down') $('#voteDownBtn').classList.add('active-down');
        }
      } catch (e) { /* ignore */ }
    }

    async function submitVote(vote) {
      const key = getProductKey();
      if (!key) return;

      try {
        // Upsert: try insert, if conflict update
        const existing = await supabaseRequest('GET', 'product_ratings', null, {
          'product_key': `eq.${key}`,
          'device_id': `eq.${deviceId}`
        });

        if (existing && existing[0]) {
          if (existing[0].vote === vote) {
            // Toggle off — delete the vote
            await supabaseRequest('DELETE', 'product_ratings', { _match_id: existing[0].id });
          } else {
            // Change vote
            await supabaseRequest('PATCH', 'product_ratings', { _match_id: existing[0].id, device_id: deviceId, vote });
          }
        } else {
          // New vote
          await supabaseRequest('POST', 'product_ratings', { device_id: deviceId, product_key: key, vote });
        }
        loadRatings();
      } catch (e) { /* ignore */ }
    }

    $('#voteUpBtn').addEventListener('click', () => submitVote('up'));
    $('#voteDownBtn').addEventListener('click', () => submitVote('down'));

    // ==========================================
    // ROUTINE WIZARD
    // ==========================================
    const WIZARD_STEPS = [
      { key: 'cleanser', label: 'Cleanser', question: 'What cleanser do you use?', placeholder: 'Search for your cleanser...' },
      { key: 'toner', label: 'Toner', question: 'Do you use a toner or essence?', placeholder: 'Search for your toner...' },
      { key: 'serum', label: 'Serum', question: 'What serum or treatment do you use?', placeholder: 'Search for your serum...' },
      { key: 'moisturizer', label: 'Moisturizer', question: 'What moisturizer do you use?', placeholder: 'Search for your moisturizer...' },
      { key: 'spf', label: 'SPF', question: 'What sunscreen do you use?', placeholder: 'Search for your sunscreen...' },
    ];

    let wizardStep = 0;
    let wizardSelections = {};

    function renderWizardStep() {
      const step = WIZARD_STEPS[wizardStep];
      const isComplete = wizardStep >= WIZARD_STEPS.length;

      // Dots
      const dots = $('#wizardDots');
      dots.innerHTML = WIZARD_STEPS.map((s, i) => {
        let cls = 'wizard__step-dot';
        if (i < wizardStep) cls += ' done';
        if (i === wizardStep && !isComplete) cls += ' active';
        return `<div class="${cls}"></div>`;
      }).join('');

      if (isComplete) {
        // Show final summary
        $('#wizardHeading').textContent = 'Your routine is ready.';
        $('#wizardDesc').textContent = '';
        $('#wizardStepLabel').textContent = '';
        $('#wizardSearch').style.display = 'none';
        $('#wizardResults').innerHTML = '';
        $('#wizardSkip').style.display = 'none';

        const summary = $('#wizardSummary');
        summary.style.display = 'block';

        let totalScore = 0;
        let counted = 0;

        summary.innerHTML = WIZARD_STEPS.map(s => {
          const sel = wizardSelections[s.key];
          if (!sel) return `
            <div class="wizard__summary-item">
              <div><span class="wizard__summary-step">${s.label}</span><br><span class="wizard__summary-name" style="opacity:0.3;">Skipped</span></div>
              <span style="opacity:0.2;">--</span>
            </div>`;

          const analysis = analyzeIngredients(parseINCI(sel.inci));
          totalScore += analysis.score;
          counted++;
          const color = analysis.score >= 80 ? 'var(--safe-green)' : (analysis.score >= 50 ? 'var(--caution-amber)' : 'var(--unsafe-red)');

          return `
            <div class="wizard__summary-item">
              <div><span class="wizard__summary-step">${s.label}</span><br><span class="wizard__summary-name">${sel.brand} ${sel.name}</span></div>
              <span class="wizard__summary-score" style="color:${color}">${analysis.score}</span>
            </div>`;
        }).join('');

        // Overall score
        const avg = counted > 0 ? Math.round(totalScore / counted) : 0;
        const finalColor = avg >= 80 ? 'var(--safe-green)' : (avg >= 50 ? 'var(--caution-amber)' : 'var(--unsafe-red)');
        const finalBg = avg >= 80 ? 'rgba(42,110,63,0.08)' : (avg >= 50 ? 'rgba(184,134,11,0.08)' : 'rgba(168,18,50,0.08)');

        const finalEl = $('#wizardFinal');
        finalEl.style.display = 'block';
        finalEl.innerHTML = `
          <div class="wizard__final-score" style="background:${finalBg};">
            <div class="wizard__final-num" style="color:${finalColor}">${avg}</div>
            <div class="wizard__final-label" style="color:${finalColor}">Overall Routine Score</div>
          </div>
          <div class="wizard__save-routine" style="text-align:center;">
            <button class="checker__submit" id="wizardSaveBtn" type="button">Save This Routine</button>
          </div>
        `;

        $('#wizardSaveBtn').addEventListener('click', async () => {
          for (const s of WIZARD_STEPS) {
            const sel = wizardSelections[s.key];
            if (!sel) continue;
            const analysis = analyzeIngredients(parseINCI(sel.inci));
            const product = {
              device_id: deviceId,
              product_name: sel.name,
              brand: sel.brand,
              inci_list: sel.inci,
              safety_score: analysis.score,
              unsafe_count: analysis.unsafe.length,
              caution_count: analysis.caution.length,
              routine_slot: (s.key === 'spf' || s.key === 'cleanser' || s.key === 'moisturizer') ? 'both' : 'am',
              is_prebuilt: true
            };
            const existing = savedProducts.find(p => p.inci_list === sel.inci);
            if (!existing) {
              const result = await supabaseRequest('POST', 'saved_products', product);
              if (result && result[0]) savedProducts.push(result[0]);
              else savedProducts.push(product);
            }
          }
          renderRoutine();
          $('#wizardSaveBtn').textContent = 'Saved!';
          $('#wizardSaveBtn').disabled = true;
          $('#wizardSaveBtn').style.background = 'var(--safe-green)';
        });
        return;
      }

      // Active step
      $('#wizardHeading').textContent = step.question;
      $('#wizardDesc').textContent = `Step ${wizardStep + 1} of ${WIZARD_STEPS.length}`;
      $('#wizardStepLabel').textContent = step.label;
      $('#wizardSearch').style.display = 'block';
      $('#wizardSearch').placeholder = step.placeholder;
      $('#wizardSearch').value = '';
      $('#wizardResults').innerHTML = '';
      $('#wizardSkip').style.display = 'inline-block';
      $('#wizardSummary').style.display = 'none';
      $('#wizardFinal').style.display = 'none';
      $('#wizardSearch').focus();
    }

    $('#wizardSearch').addEventListener('input', () => {
      const q = $('#wizardSearch').value.toLowerCase().trim();
      const resultsDiv = $('#wizardResults');
      resultsDiv.innerHTML = '';
      if (q.length < 2) return;

      const matches = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        `${p.brand} ${p.name}`.toLowerCase().includes(q)
      ).slice(0, 8);

      matches.forEach(p => {
        const div = document.createElement('div');
        div.className = 'checker__search-item';
        div.innerHTML = `
          <div>
            <div class="checker__search-item-name">${p.brand} ${p.name}</div>
            <div class="checker__search-item-brand">${p.category}</div>
          </div>
          <span class="checker__search-item-category">Select</span>
        `;
        div.addEventListener('click', () => {
          wizardSelections[WIZARD_STEPS[wizardStep].key] = p;
          wizardStep++;
          renderWizardStep();
        });
        resultsDiv.appendChild(div);
      });

      if (matches.length === 0) {
        resultsDiv.innerHTML = '<p style="padding:1rem;opacity:0.4;font-size:0.85rem;">No match found. You can skip this step.</p>';
      }
    });

    $('#wizardSkip').addEventListener('click', () => {
      wizardStep++;
      renderWizardStep();
    });

    $('#openWizardBtn').addEventListener('click', () => {
      wizardStep = 0;
      wizardSelections = {};
      const wiz = $('#wizard');
      wiz.classList.add('visible');
      renderWizardStep();
      wiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // ==========================================
    // INIT
    // ==========================================
    loadSavedData();
    checkUrlHash();

  })();
