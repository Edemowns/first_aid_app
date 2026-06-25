// constants/firstaid.js
// Local, fully offline First Aid handbook fallback for Ghana
// Includes critical steps, warnings, and severity assessments in English and Twi

export const OFFLINE_FIRST_AID = {
  drowning: {
    condition: 'Drowning (Nsuo)',
    severity: 'critical',
    call_immediately: true,
    steps: {
      en: [
        'Get the person out of the water safely without putting yourself in danger.',
        'Check if they are breathing. If not breathing, start CPR immediately (30 chest compressions followed by 2 rescue breaths).',
        'If they are breathing, turn them onto their side (recovery position) to keep their airway clear.',
        'Keep them warm. Remove wet clothes and cover them with a dry blanket.',
        'Do not leave them alone. Wait for the ambulance.'
      ],
      twi: [
        'Yi onipa no firi nsuo no mu asiane biara mu a wobɛhyɛ wo ho.',
        'Hwɛ sɛ ɔrehome. Sɛ ɔnnhome a, hyɛ aseɛ yɛ CPR ntɛm ara (bɔ ne koko mu mprɛ 30 na fono mu mprɛ 2).',
        'Sɛ ɔrehome a, dan no to ne nfe mu (recovery position) na ne home kwan mu ada hɔ.',
        'Ma ne ho yɛ hye. Yi ne ntar a agyene no na fa mpopaho kɛseɛ kura no.',
        'Gyae no nkoaa. Twɛn ambulance no.'
      ]
    },
    warnings: {
      en: [
        'Do not try to perform rescue breathing or CPR in the water.',
        'Do not pump their stomach to clear out water — this can cause vomiting and choking.',
        'Do not warm them too quickly.'
      ],
      twi: [
        'Mmyɛ rescue breathing anaa CPR wɔ nsuo no mu.',
        'Mmpompom ne yam sɛ wobɛyi nsuo — eyi bɛtumi ama ɔfe na ahono ne home.',
        'Mmyɛ ne ho hye ntɛm dodo.'
      ]
    }
  },
  bleeding: {
    condition: 'Bleeding (Mogya)',
    severity: 'critical',
    call_immediately: true,
    steps: {
      en: [
        'Apply direct, firm pressure on the wound using a clean cloth or bandage.',
        'Keep the pressure steady for at least 10 minutes without checking the wound.',
        'Elevate the injured limb above the level of the heart if possible.',
        'If blood seeps through, place another cloth on top. Do not remove the first cloth.',
        'Help the person lie down and keep them warm to prevent shock.'
      ],
      twi: [
        'Mia kuruwa no so pintinn fa ntoma a ho tew anaa bandage.',
        'Mia so saa kyɛn sima 10 a wunyi wo nsa mfe.',
        'Sɛ ɛbɛyɛ yiye a, pagya ne nsa anaa ne nan no kɔ soro boro ne koma so.',
        'Sɛ mogya no pue mu a, fa ntoma foforo to so. Mmyi kan deɛ no.',
        'Boa no ma ɔda fam na kyekyere ne ho sɛnea ɔbɛnya ahonnhye.'
      ]
    },
    warnings: {
      en: [
        'Do not remove the original bandage or cloth once placed, as this disrupts clotting.',
        'Do not wash a deep or heavily bleeding wound under a tap.',
        'Do not apply a tourniquet unless you are trained or the bleeding is life-threatening.'
      ],
      twi: [
        'Mmyi kan ntoma a wode miaa so no, eyi sɛe mogya a ɛretow no.',
        'Mmhohoro kuruwa a ɛmu dɔ anaa mogya pii gu so gu asuo ase.',
        'Mmyɛ tourniquet gye sɛ woanya nteteeɛ anaa mogya no kɔ so dodo.'
      ]
    }
  },
  burns: {
    condition: 'Burns (Ogya)',
    severity: 'moderate',
    call_immediately: false,
    steps: {
      en: [
        'Cool the burn immediately under cool, running water for 10 to 20 minutes.',
        'Do not use ice, ice water, or greasy substances like butter or toothpaste.',
        'Remove any jewelry or tight clothing near the burn area before it swells.',
        'Cover the burn loosely with a clean, non-stick plastic wrap or clean cloth.',
        'If the burn is large, on the face, hands, or genitals, seek emergency care immediately.'
      ],
      twi: [
        'Ma nsuo nwunu asen gu ogya hye no so sima 10 kɔsi 20 ntɛm ara.',
        'Mfa ice, nsuo nwunu dodo, anaa butter, toothpaste anaa ngo foforo mgu so.',
        'Yi nsaa, kawa anaa ntar biara a ɛbɛn hye no ansa na ne ho akyen.',
        'Fa plastic wrap a ho tew anaa ntoma foforo kyekyere hye no so mmerɛw.',
        'Sɛ hye no kɛseɛ na ɛwɔ anim, nsa, anaa ne kɔte/fe so a, kɔ ayaresabea ntɛm.'
      ]
    },
    warnings: {
      en: [
        'Do not pop any blisters, as this increases infection risks.',
        'Do not apply toothpaste, butter, raw egg, or local herbs to the burn.',
        'Do not peel off clothing that is stuck to the burn.'
      ],
      twi: [
        'Mmpae blisters (asubra), ɛbɛtumi ama mmoawa anya kwan afa mu.',
        'Mfa toothpaste, butter, kɔkɔɔ kosua, anaa nwura mgu ogya hye no so.',
        'Mntwetwe ntar a ɛnam to hye no ho.'
      ]
    }
  },
  broken_bone: {
    condition: 'Broken Bone (Dompe)',
    severity: 'moderate',
    call_immediately: false,
    steps: {
      en: [
        'Do not try to realign the bone or push a bone back in.',
        'Keep the injured area completely still. Use a splint (stick or folded cardboard) to support it.',
        'Apply a cold pack wrapped in a cloth to the area to reduce swelling.',
        'If there is an open wound, cover it gently with a clean cloth. Do not flush it.',
        'Elevate the limb if possible and seek medical attention immediately.'
      ],
      twi: [
        'Mmbɔ mmden sɛ wobɛtenteɛ dompe no kɔ ne beaeɛ.',
        'Ma beaeɛ a apira no nnyɛ ya. Fa dua anaa folded cardboard boa ano.',
        'Fa ntoma kyekyere ice nwunu gu so na anya akye.',
        'Sɛ kuro bue hɔ a, fa ntoma a ho tew kata so mmerɛw. Mmhye aseɛ mpaapaa so.',
        'Pagya ne nsa anaa ne nan no na kɔ ayaresabea ntɛm.'
      ]
    },
    warnings: {
      en: [
        'Do not move the person if you suspect a neck or spine injury.',
        'Do not allow the person to walk or use the injured limb.',
        'Do not massage the injured area.'
      ],
      twi: [
        'Mmsoso onipa no sɛ wugye di sɛ ne kɔn anaa ne akyi dompe apira.',
        'Mmma no kwan mma ɔnnante anaa ɔmmfa nsa/nan a apira no nnyɛ adwuma.',
        'Mmsɔre/mmpompom beaeɛ a apira no.'
      ]
    }
  },
  choking: {
    condition: 'Choking (Ɔhome)',
    severity: 'critical',
    call_immediately: true,
    steps: {
      en: [
        'Encourage the person to cough hard to clear the blockage.',
        'If they cannot speak, cough, or breathe, give 5 back blows between their shoulder blades with the heel of your hand.',
        'If the blockage is still there, perform 5 abdominal thrusts (Heimlich maneuver): Stand behind them, wrap arms around waist, and pull inward and upward quickly.',
        'Alternate 5 back blows and 5 abdominal thrusts until the object is expelled or they lose consciousness.',
        'If they pass out, lay them down and start CPR.'
      ],
      twi: [
        'Hyɛ no nkuran ma ɔnwɔ bɔne kɛseɛ sɛ kwan no bɛbue.',
        'Sɛ ɔnntumi nkasa, ɔnnwɔ bɔne, anaa ɔnnhome a, bɔ n’akyi mprɛ 5 wɔ ne kɔn ne nfe ntam.',
        'Sɛ annyi a, yɛ abdominal thrusts mprɛ 5: Gyina n’akyi, kyekyere ne sika ho na titi kɔ soro ntɛm.',
        'Kɔ so yɛ n’akyi bɔ mprɛ 5 ne abdominal thrusts mprɛ 5 kɔsi sɛ deɛ amia no bɛpue.',
        'Sɛ ɔpa abaw a, to no fam na hyɛ aseɛ yɛ CPR.'
      ]
    },
    warnings: {
      en: [
        'Do not perform abdominal thrusts on pregnant women or infants under 1 year (use chest thrusts/back blows instead).',
        'Do not perform a blind finger sweep to retrieve the object as you might push it deeper.',
        'Do not ignore choking even if the object is coughed up (visit a doctor to check).'
      ],
      twi: [
        'Mmyɛ abdominal thrusts mma abemfoɔ anaa mmofra a wonnyɛɛ afe 1.',
        'Mmhye wo nsa ngu ne nsa mu pɛ aduane no na wobɛtumi apia akɔ mu dodo.',
        'Mmbu animtiaa choking mpo sɛ adeɛ no pue a (kɔ ayaresabea kɔhwɛ).'
      ]
    }
  },
  seizure: {
    condition: 'Seizure (Ahohow)',
    severity: 'moderate',
    call_immediately: false,
    steps: {
      en: [
        'Gently guide the person to the floor and place something soft under their head.',
        'Clear the area of sharp or dangerous objects to prevent injury.',
        'Turn them gently onto their side once the shaking stops to keep their airway open.',
        'Time the seizure. If it lasts more than 5 minutes, call an ambulance.',
        'Stay with them until they are fully awake and alert.'
      ],
      twi: [
        'Boa onipa no mmerɛw kɔ fam na fa ade mmerɛw gu ne ti ase.',
        'Yi nneɛma a ɛyɛ nnam firi ne ho na ɔnnnyɛ ne ho ya.',
        'Dan no to ne nfe mu mmerɛw sɛ shook no gyae a, na home kwan mu ada hɔ.',
        'Hwɛ berɛ a seizure no bɛkyɛ. Sɛ ɛboro sima 5 a, frɛ ambulance ntɛm.',
        'Gyina ne ho kɔsi sɛ n’ani bɛgye koraa.'
      ]
    },
    warnings: {
      en: [
        'Do not hold the person down or try to stop their movements.',
        'Do not put anything in their mouth (no spoons, cloth, or fingers).',
        'Do not give them water, food, or medicine until they are fully conscious.'
      ],
      twi: [
        'Mmsɔ onipa no pintinn na woannya n’adwuma kwan.',
        'Mmfa hwee mgu ne nsa mu (mfa didide, ntoma anaa wo nsa mgu mu).',
        'Mmma no nsuo, aduane anaa aduro biara kɔsi sɛ ɔbɛba ne ho koraa.'
      ]
    }
  },
  heart_attack: {
    condition: 'Heart Attack (Akoma)',
    severity: 'critical',
    call_immediately: true,
    steps: {
      en: [
        'Have the person sit down, rest, and try to keep calm.',
        'Loosen any tight clothing around their neck or chest.',
        'If they have prescribed heart medicine (like nitroglycerin), help them take it.',
        'If they are not allergic, have them chew and swallow one full aspirin (325mg).',
        'If they lose consciousness and stop breathing, start CPR immediately.'
      ],
      twi: [
        'Ma onipa no ntena fam, nnhome, na ɔnyɛ komm.',
        'Yɛ ntar a amia ne kɔn anaa ne koko ho mmerɛw.',
        'Sɛ ɔwɔ akoma aduro (te sɛ nitroglycerin) a, boa no na ɔnnom.',
        'Sɛ ɔnnnye aspirin ho yaw a, ma no nwene na ɔmmene aspirin (325mg) baako.',
        'Sɛ ɔpa abaw na ɔnnhome a, hyɛ aseɛ yɛ CPR ntɛm ara.'
      ]
    },
    warnings: {
      en: [
        'Do not allow them to drive themselves to the hospital.',
        'Do not leave them unattended.',
        'Do not give them water or food if they are struggling to breathe.'
      ],
      twi: [
        'Mmma no kwan mma ɔnnka kar nkɔ ayaresabea.',
        'Mngyae no nkoaa.',
        'Mmma no nsuo anaa aduane sɛ ɔretow home a.'
      ]
    }
  },
  snake_bite: {
    condition: 'Snake Bite (Ɔwɔ Ka)',
    severity: 'critical',
    call_immediately: true,
    steps: {
      en: [
        'Keep the person calm and completely still. Movement spreads venom faster.',
        'Remove any jewelry or tight clothing before swelling starts.',
        'Clean the bite area gently with soap and water if possible, but do not scrub.',
        'Keep the bite site at or below the level of the heart.',
        'Note the snake\'s appearance (color, size, pattern) if safe, and get them to the hospital immediately.'
      ],
      twi: [
        'Ma onipa no nyɛ komm na ɔnnhu kwan biara. Akwanbɔ bɛtumi ama ɔwɔ bɔne no akɔ ntɛm.',
        'Yi kawa anaa nneɛma a amia ne ho ansa na kuro no akyen.',
        'Hohoro kuro no so mmerɛw fa samina ne nsuo, nso mmpampa so.',
        'Ma beaeɛ a ɔwɔ kaa no nnyɛ boro koma so.',
        'Sɛ asiane nni ho a, hyɛ nso sɛnea ɔwɔ no teɛ (ne kɔla, kɛseɛ) na kɔ ayaresabea ntɛm.'
      ]
    },
    warnings: {
      en: [
        'Do not cut the wound or try to suck out the venom.',
        'Do not apply ice, water, or tourniquets to the bite.',
        'Do not try to catch or kill the snake as you risk getting bitten again.'
      ],
      twi: [
        'Mmfa adadeɛ mmpa kuro no so anaa mmsese ɔwɔ bɔne no mfiri mu.',
        'Mmfa ice, nsuo, anaa tourniquets mgu kuro no so.',
        'Mmbɔ mmden sɛ wobɛkyere anaa wobɛkum ɔwɔ no na ɔnnka wo bio.'
      ]
    }
  },
  poisoning: {
    condition: 'Poisoning (Aduro Bɔne Nom)',
    severity: 'critical',
    call_immediately: true,
    steps: {
      en: [
        'Try to identify what substance was swallowed, inhaled, or touched, and how much.',
        'If the person is unconscious or not breathing, call 193 and start CPR immediately.',
        'Do not induce vomiting unless specifically instructed by medical professionals.',
        'If the substance is on the skin or in the eyes, rinse gently with clean water for 15-20 minutes.',
        'Keep the container or label of the substance to show to the emergency medical team.'
      ],
      twi: [
        'Hwɛ sɛ wobɛtumi ahu aduro bɔne anaa nwura ko a onipa no anom anaa ɔde nsa aka.',
        'Sɛ onipa no atɔ sim na ɔnnhome a, frɛ 193 na hyɛ aseɛ yɛ CPR ntɛm ara.',
        'Mmma no nnfe gye sɛ adɔktafoɔ na wɔhyɛ wo sɛ yɛ saa.',
        'Sɛ aduro bɔne no gu ne wedeɛ anaa n’ani so a, fa nsuo hohoro so sima 15 kɔsi 20.',
        'Kora aduro no kuruwa anaa deɛ ɛda so no so sɛ wobɛkyerɛ adɔktafoɔ.'
      ]
    },
    warnings: {
      en: [
        'Do not give the person anything to eat or drink (including milk or water) unless instructed by a doctor.',
        'Do not induce vomiting — this can cause chemical burns to the throat or lungs.'
      ],
      twi: [
        'Mmma onipa no hwee nnidi anaa nnnom (mpo nufusuo anaa nsuo) gye sɛ ɔdokta se yɛ saa.',
        'Mmma no nnfe — eyi bɛtumi ahyɛ ne home kwan anaa ne home beaeɛ.'
      ]
    }
  },
  asthma: {
    condition: 'Difficulty Breathing / Asthma (Ɔhome-teetee / Asthma)',
    severity: 'critical',
    call_immediately: true,
    steps: {
      en: [
        'Help the person sit upright in a comfortable position. Do not let them lie down.',
        'Help them use their emergency inhaler (usually blue, e.g., Salbutamol/Albuterol).',
        'Keep them calm and encourage slow, steady breathing.',
        'Loosen any tight clothing around their neck or chest.',
        'If they do not have an inhaler, if it does not work, or if they struggle to speak, call 193 immediately.'
      ],
      twi: [
        'Boa onipa no ma ɔntena fam pintinn. Mmma no nnda fam.',
        'Boa no ma ɔmmfa ne home aduro (inhaler bibiriw, te sɛ Salbutamol).',
        'Ma ne ho nyɛ komm na hyɛ no nkuran ma ɔnhome mmerɛw.',
        'Yɛ ntar a amia ne kɔn anaa ne koko ho mmerɛw.',
        'Sɛ onni aduro no bi, anaa sɛ anyɛ adwuma, anaa ɔretow home a, frɛ 193 ntɛm.'
      ]
    },
    warnings: {
      en: [
        'Do not leave the person alone.',
        'Do not give them cold drinks, as this can worsen airway spasms.'
      ],
      twi: [
        'Mngyae onipa no nkoaa.',
        'Mmma no nsuo anaa nneɛma nwunu, eyi bɛtumi asɛe ne home kwan.'
      ]
    }
  },
  fever: {
    condition: 'Fever / High Temp (Ahoo-hye / Fever)',
    severity: 'moderate',
    call_immediately: false,
    steps: {
      en: [
        'Have the person rest in a cool, well-ventilated room.',
        'Wipe their forehead, neck, and underarms with a clean cloth damp with lukewarm water (lukewarm sponging).',
        'Give them plenty of water or oral rehydration fluids to prevent dehydration.',
        'If appropriate, give over-the-counter fever reducers like Paracetamol. Avoid Aspirin for children.',
        'Seek medical help if the fever is extremely high, lasts over 3 days, or is accompanied by a stiff neck.'
      ],
      twi: [
        'Ma onipa no nhome wɔ beaeɛ a mframa bɔ mu yiye.',
        'Fa ntoma ne nsuo mmerɛw (lukewarm) popo n’anim, ne kɔn, ne ne nwaha ase.',
        'Ma no nsuo pii anaa ORS mma ne ho nnyɛ kɔntɔn.',
        'Sɛ ɛbɛyɛ yiye a, ma no Paracetamol. Mmma mmofra Aspirin.',
        'Kɔ ayaresabea ntɛm sɛ fever no kɔ soro dodo, anaa ɛkyɛ kyɛn nnansa.'
      ]
    },
    warnings: {
      en: [
        'Do not use cold water, ice, or alcohol rubs to cool the person, as this can cause shivering and raise core temperature.',
        'Do not bundle them in heavy blankets.'
      ],
      twi: [
        'Mmfa nsuo nwunu dodo, ice, anaa alcohol mpopoo ne ho, ɛbɛtumi ama ne ho awɔw na ama ahoo-hye no akɔ soro.',
        'Mmfa mpopaho pii nkata ne ho.'
      ]
    }
  },
  head_injury: {
    condition: 'Head Injury / Concussion (Atipira / Concussion)',
    severity: 'critical',
    call_immediately: true,
    steps: {
      en: [
        'Keep the person completely still and prevent them from moving their head or neck.',
        'If there is bleeding, apply direct pressure with a clean cloth, unless you suspect a skull fracture.',
        'Apply a cold compress wrapped in a cloth to reduce swelling.',
        'Monitor their alertness. Check if they are confused, vomiting, or losing consciousness.',
        'Call 193 or go to the hospital immediately if they lost consciousness, are vomiting, or have blood/fluid draining from ears or nose.'
      ],
      twi: [
        'Ma onipa no nyɛ komm na mma no nnwoso ne ti anaa ne kɔn.',
        'Sɛ mogya retow a, mia so ntɛm fa ntoma a ho tew gye sɛ wugye di sɛ ne ti-dompe apae.',
        'Fa ice nwunu a ɛwɔ ntoma mu gu so na swollen no anya akye.',
        'Hwɛ sɛ n’adwene da ne ho. Hwɛ sɛ ɔrefe, n’ani so retow, anaa ɔretɔ sim.',
        'Frɛ 193 anaa kɔ ayaresabea ntɛm sɛ ɔtɔɔ sim, ɔrefe, anaa mogya/nsuo firi ne nsa/asɔ mu pue.'
      ]
    },
    warnings: {
      en: [
        'Do not remove any objects stuck in the head wound.',
        'Do not give them any medication or water until assessed by a professional.'
      ],
      twi: [
        'Mmyi deɛ amia ne ti no mu.',
        'Mmma no aduro anaa nsuo biara kɔsi sɛ dɔkta bɛhwɛ no.'
      ]
    }
  },
  headache: {
    condition: 'Headache (Ti-Yadeɛ)',
    severity: 'mild',
    call_immediately: false,
    steps: {
      en: [
        'Rest in a quiet, dark, and cool room.',
        'Apply a cool compress or damp cloth to your forehead or the back of your neck.',
        'Drink plenty of water to stay hydrated.',
        'If appropriate, take mild over-the-counter pain relievers like Paracetamol.',
        'Seek immediate medical care if the headache is sudden and extremely severe, or accompanied by fever, stiff neck, confusion, or difficulty speaking.'
      ],
      twi: [
        'Home wɔ beaeɛ a ɛhɔ yɛ komm, sum, na mframa bɔ mu yiye.',
        'Fa ntoma nwunu to w’anim anaa wo kɔn akyi.',
        'Nom nsuo pii na w’ahonnhye anya ahoɔden.',
        'Sɛ ɛbɛyɛ yiye a, gye Paracetamol na anya akye.',
        'Kɔ ayaresabea ntɛm sɛ ti-yadeɛ no bae mprempren ara na ɛyɛ ya dodo, anaa fever, kɔn-akyini-mu-den, anaa adwene-futu ka ho.'
      ]
    },
    warnings: {
      en: [
        'Do not take medication on an empty stomach.',
        'Do not ignore a sudden, severe headache (often called "the worst headache of your life").'
      ],
      twi: [
        'Mmnom aduro biara wɔ kɔm mu.',
        'Mmbom animtiaa ti-yadeɛ a ɛbae mpofirim na ɛyɛ ya pii.'
      ]
    }
  },
  trauma: {
    condition: 'Physical Trauma / Accident (Asiane / Apira)',
    severity: 'critical',
    call_immediately: true,
    steps: {
      en: [
        'Check for immediate dangers (e.g., traffic, fire, electricity) before approaching.',
        'Call emergency services immediately (193).',
        'If there is heavy bleeding, apply firm pressure with a clean cloth.',
        'Do not move the injured person unless they are in immediate danger of further injury.',
        'Keep the person calm and warm. Check their breathing regularly.'
      ],
      twi: [
        'Hwɛ sɛ asiane biara nni beaeɛ hɔ (te sɛ kar foforo, ogya, anaa anyinam-nyane) ansa na woakɔ hɔ.',
        'Frɛ ambulance ntɛm ara (193).',
        'Sɛ mogya retow pii a, mia so pintinn fa ntoma a ho tew.',
        'Mmsoso na mnyɛ onipa no ya gye sɛ asiane foforo bɛto no.',
        'Ma ne ho nyɛ komm na kyekyere ne ho. Hwɛ ne home daa.'
      ]
    },
    warnings: {
      en: [
        'Do not move anyone with suspected neck or spinal injury unless absolutely necessary.',
        'Do not give them anything to eat or drink.'
      ],
      twi: [
        'Mmsoso onipa a wugye di sɛ ne kɔn anaa n’akyi dompe apira gye sɛ ɛhia dodo.',
        'Mmma no aduane anaa nsuo biara.'
      ]
    }
  }
};

// Advanced fuzzy/keyword matching helper
export function findOfflineFirstAid(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  
  // Prioritize highly specific terms first
  
  // Accident / Trauma / Crash
  if (lower.includes('accident') || lower.includes('crash') || lower.includes('collision') || lower.includes('fall') || lower.includes('car') || lower.includes('motor') || lower.includes('asiane')) {
    return OFFLINE_FIRST_AID.trauma;
  }

  // Headache
  if (lower.includes('headache') || lower.includes('migraine') || lower.includes('ti-yadeɛ') || lower.includes('ti yadeɛ')) {
    return OFFLINE_FIRST_AID.headache;
  }

  // Poisoning
  if (lower.includes('poison') || lower.includes('chemical') || lower.includes('toxic') || lower.includes('swallowed') || lower.includes('aduro bɔne') || lower.includes('nom')) {
    return OFFLINE_FIRST_AID.poisoning;
  }

  // Asthma / Breathing
  if (lower.includes('asthma') || lower.includes('breathe') || lower.includes('breathing') || lower.includes('shortness') || lower.includes('inhaler') || lower.includes('home-teetee') || lower.includes('home')) {
    // Only return choking if specifically choke-related, otherwise default to breathing/asthma if "breathe" is queried
    if (lower.includes('chok') || lower.includes('throat') || lower.includes('swallow') || lower.includes('stuck')) {
      return OFFLINE_FIRST_AID.choking;
    }
    return OFFLINE_FIRST_AID.asthma;
  }

  // Fever
  if (lower.includes('fever') || lower.includes('temperature') || lower.includes('hot') || lower.includes('hoo-hye') || lower.includes('malaria')) {
    if (lower.includes('burn') || lower.includes('fire') || lower.includes('ogya')) {
      return OFFLINE_FIRST_AID.burns;
    }
    return OFFLINE_FIRST_AID.fever;
  }

  // Head Injury
  if (lower.includes('head') || lower.includes('concussion') || lower.includes('brain') || lower.includes('skull') || lower.includes('atipira') || lower.includes('hit')) {
    return OFFLINE_FIRST_AID.head_injury;
  }

  // Snake Bite
  if (lower.includes('snake') || lower.includes('bite') || lower.includes('wɔ') || lower.includes('venom') || lower.includes('viper') || lower.includes('cobra')) {
    return OFFLINE_FIRST_AID.snake_bite;
  }
  
  // Heart Attack
  if (lower.includes('heart') || lower.includes('attack') || lower.includes('akoma') || lower.includes('chest') || lower.includes('cardiac') || lower.includes('stroke')) {
    return OFFLINE_FIRST_AID.heart_attack;
  }
  
  // Choking
  if (lower.includes('chok') || lower.includes('airway') || lower.includes('throat') || lower.includes('swallow') || lower.includes('gag') || lower.includes('block') || lower.includes('stuck')) {
    return OFFLINE_FIRST_AID.choking;
  }
  
  // Seizure
  if (lower.includes('seiz') || lower.includes('fit') || lower.includes('epilep') || lower.includes('ahohow') || lower.includes('convuls') || lower.includes('shak') || lower.includes('trembl')) {
    return OFFLINE_FIRST_AID.seizure;
  }
  
  // Broken Bone
  if (lower.includes('bone') || lower.includes('fracture') || lower.includes('break') || lower.includes('dompe') || lower.includes('snap') || lower.includes('arm') || lower.includes('leg') || lower.includes('joint') || lower.includes('crack')) {
    return OFFLINE_FIRST_AID.broken_bone;
  }
  
  // Drowning
  if (lower.includes('drown') || lower.includes('nsuo') || lower.includes('swim') || lower.includes('pool') || lower.includes('water') || lower.includes('suffocat') || lower.includes('sink')) {
    return OFFLINE_FIRST_AID.drowning;
  }
  
  // Burns
  if (lower.includes('burn') || lower.includes('fire') || lower.includes('ogya') || lower.includes('scald') || lower.includes('boil') || lower.includes('acid') || lower.includes('steam')) {
    return OFFLINE_FIRST_AID.burns;
  }
  
  // Bleeding
  if (lower.includes('bleed') || lower.includes('blood') || lower.includes('mogya') || lower.includes('cut') || lower.includes('wound') || lower.includes('stab') || lower.includes('gash') || lower.includes('flow') || lower.includes('injury')) {
    return OFFLINE_FIRST_AID.bleeding;
  }
  
  return null;
}
