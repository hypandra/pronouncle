export interface WordItem {
  word: string
  definition: string
  sentence: string
  category: string
}

export const WORD_DATA: WordItem[] = [
  // First Grade
  { word: "answer", definition: "A reply to a question", sentence: "The answer to the math problem is twenty-five.", category: "First Grade" },
  { word: "build", definition: "To construct something", sentence: "We will build a sandcastle at the beach.", category: "First Grade" },
  { word: "climb", definition: "To go up something", sentence: "The cat can climb the tall tree easily.", category: "First Grade" },
  { word: "comb", definition: "A tool for fixing hair", sentence: "She uses a comb to brush her hair every morning.", category: "First Grade" },
  { word: "friend", definition: "A person you like and trust", sentence: "My best friend lives next door to me.", category: "First Grade" },
  { word: "ghost", definition: "A spirit of a dead person", sentence: "The old house is said to have a ghost living in it.", category: "First Grade" },
  { word: "hour", definition: "Sixty minutes", sentence: "School starts at eight o'clock, so we have one hour to eat breakfast.", category: "First Grade" },
  { word: "island", definition: "Land surrounded by water", sentence: "We took a boat to visit the beautiful island.", category: "First Grade" },
  { word: "knock", definition: "To hit something with your hand", sentence: "Please knock on the door before entering the room.", category: "First Grade" },
  { word: "school", definition: "A place where children learn", sentence: "I go to school every day to learn new things.", category: "First Grade" },

  // Third Grade
  { word: "caught", definition: "Past tense of catch", sentence: "The baseball player caught the ball with his glove.", category: "Third Grade" },
  { word: "cough", definition: "To force air out of your lungs", sentence: "When you have a cold, you might cough a lot.", category: "Third Grade" },
  { word: "different", definition: "Not the same", sentence: "My sister and I have different favorite colors.", category: "Third Grade" },
  { word: "enough", definition: "As much as needed", sentence: "We have enough cookies for everyone at the party.", category: "Third Grade" },
  { word: "February", definition: "Second month of the year", sentence: "My birthday is on February 12th.", category: "Third Grade" },
  { word: "laugh", definition: "To make happy sounds", sentence: "The funny movie made us all laugh loudly.", category: "Third Grade" },
  { word: "measure", definition: "To find the size or amount", sentence: "Use a ruler to measure how long the table is.", category: "Third Grade" },
  { word: "ocean", definition: "A large body of salt water", sentence: "The ocean waves crashed against the shore.", category: "Third Grade" },
  { word: "rough", definition: "Not smooth", sentence: "The rough sandpaper is used to smooth wood.", category: "Third Grade" },
  { word: "rural", definition: "Relating to the countryside", sentence: "My grandparents live in a rural town with only 500 people.", category: "Third Grade" },
  { word: "stomach", definition: "The organ that digests food", sentence: "My stomach hurts after eating too much candy.", category: "Third Grade" },
  { word: "tongue", definition: "The muscle in your mouth", sentence: "Stick out your tongue and say 'ahh' for the doctor.", category: "Third Grade" },

  // Fifth Grade
  { word: "appetite", definition: "A desire to eat", sentence: "After playing outside, I have a big appetite for dinner.", category: "Fifth Grade" },
  { word: "biscuit", definition: "A small, soft bread", sentence: "I like to eat biscuits with butter and jam.", category: "Fifth Grade" },
  { word: "business", definition: "Work or trade", sentence: "My dad owns a business that sells computers.", category: "Fifth Grade" },
  { word: "chocolate", definition: "A sweet made from cocoa", sentence: "Chocolate is my favorite candy to eat.", category: "Fifth Grade" },
  { word: "daughter", definition: "A female child", sentence: "The queen's daughter will become the next ruler.", category: "Fifth Grade" },
  { word: "language", definition: "A system of communication", sentence: "English is the language we speak in school.", category: "Fifth Grade" },
  { word: "library", definition: "A place with many books", sentence: "I go to the library to borrow books to read.", category: "Fifth Grade" },
  { word: "muscle", definition: "Tissue that makes you strong", sentence: "You need strong muscles to lift heavy weights.", category: "Fifth Grade" },
  { word: "nephew", definition: "The son of your brother or sister", sentence: "My nephew likes to play with toy cars.", category: "Fifth Grade" },
  { word: "quinoa", definition: "Protein-rich seed from South America", sentence: "Mom cooked quinoa instead of rice for dinner.", category: "Fifth Grade" },
  { word: "vegetable", definition: "A plant used as food", sentence: "Carrots are my favorite vegetable to eat.", category: "Fifth Grade" },

  // Seventh Grade
  { word: "chaos", definition: "Complete disorder", sentence: "The classroom was in chaos after the teacher left.", category: "Seventh Grade" },
  { word: "choir", definition: "A group of singers", sentence: "The school choir sings beautiful songs.", category: "Seventh Grade" },
  { word: "colonel", definition: "A military rank", sentence: "The colonel led his soldiers into battle.", category: "Seventh Grade" },
  { word: "comfortable", definition: "Feeling at ease", sentence: "This chair is very comfortable to sit in.", category: "Seventh Grade" },
  { word: "gauge", definition: "To measure or estimate", sentence: "Use a gauge to measure the air pressure in the tire.", category: "Seventh Grade" },
  { word: "genuine", definition: "Real and authentic", sentence: "This painting is a genuine work of art.", category: "Seventh Grade" },
  { word: "jewelry", definition: "Decorative items worn on the body", sentence: "She wears beautiful jewelry on special occasions.", category: "Seventh Grade" },
  { word: "onomatopoeia", definition: "Word imitating a sound (like \"buzz\")", sentence: "The word \"splash\" is an onomatopoeia for water hitting the ground.", category: "Seventh Grade" },
  { word: "recipe", definition: "Instructions for cooking", sentence: "Follow the recipe to make chocolate chip cookies.", category: "Seventh Grade" },
  { word: "rhythm", definition: "A regular pattern of beats", sentence: "The drummer keeps the rhythm for the band.", category: "Seventh Grade" },
  { word: "wednesday", definition: "The fourth day of the week", sentence: "Wednesday is in the middle of the school week.", category: "Seventh Grade" },

  // Ninth Grade
  { word: "anarchy", definition: "Absence of government", sentence: "The country fell into anarchy after the revolution.", category: "Ninth Grade" },
  { word: "bureaucracy", definition: "Complex administrative system", sentence: "The bureaucracy makes it hard to get things done quickly.", category: "Ninth Grade" },
  { word: "conscience", definition: "Inner sense of right and wrong", sentence: "My conscience tells me to tell the truth.", category: "Ninth Grade" },
  { word: "entrepreneur", definition: "Someone who starts businesses", sentence: "The entrepreneur started a successful company.", category: "Ninth Grade" },
  { word: "hierarchy", definition: "A system of ranks", sentence: "The company has a clear hierarchy of management.", category: "Ninth Grade" },
  { word: "mischievous", definition: "Playfully causing minor trouble", sentence: "My mischievous brother hid my phone as a prank.", category: "Ninth Grade" },
  { word: "nausea", definition: "Feeling like you might vomit", sentence: "The bumpy car ride gave me nausea.", category: "Ninth Grade" },
  { word: "parliament", definition: "A group of elected representatives", sentence: "Parliament makes laws for the country.", category: "Ninth Grade" },
  { word: "queue", definition: "A line of people waiting", sentence: "We had to queue for tickets at the movie theater.", category: "Ninth Grade" },
  { word: "thorough", definition: "Complete and careful", sentence: "Do a thorough job cleaning your room.", category: "Ninth Grade" },

  // SAT Style
  { word: "Albert Camus", definition: "French philosopher and author (1913-1960)", sentence: "Albert Camus wrote books about finding meaning in life.", category: "SAT Style" },
  { word: "acquiesce", definition: "To agree or accept", sentence: "She will acquiesce to the new school rules.", category: "SAT Style" },
  { word: "cacophony", definition: "Harsh, discordant sound", sentence: "The cacophony of car horns woke me up.", category: "SAT Style" },
  { word: "ebullient", definition: "Enthusiastic and cheerful", sentence: "The ebullient student won the science fair.", category: "SAT Style" },
  { word: "epitome", definition: "Perfect example of something", sentence: "Her kindness to everyone made her the epitome of a good friend.", category: "SAT Style" },
  { word: "facetious", definition: "Treating serious things humorously", sentence: "His facetious comments made everyone laugh.", category: "SAT Style" },
  { word: "isthmus", definition: "Narrow land connecting two larger areas", sentence: "We drove across the isthmus to reach the peninsula.", category: "SAT Style" },
  { word: "obfuscate", definition: "To make unclear or confusing", sentence: "The politician tried to obfuscate the truth.", category: "SAT Style" },
  { word: "panacea", definition: "A solution for all problems", sentence: "There is no panacea for poverty.", category: "SAT Style" },
  { word: "quintessential", definition: "Most typical example", sentence: "This painting is the quintessential work of art.", category: "SAT Style" },
  { word: "recalcitrant", definition: "Stubbornly resistant to authority", sentence: "The recalcitrant toddler refused to eat his vegetables.", category: "SAT Style" },
  { word: "sesquipedalian", definition: "Using long words", sentence: "The teacher used sesquipedalian language that confused the class.", category: "SAT Style" },
  { word: "superfluous", definition: "Unnecessary", sentence: "The extra decorations are superfluous.", category: "SAT Style" },
  { word: "ubiquitous", definition: "Present everywhere", sentence: "Smartphones are ubiquitous in modern life.", category: "SAT Style" },

  // Medical
  { word: "anesthesiologist", definition: "Doctor who gives anesthesia", sentence: "The anesthesiologist put the patient to sleep for surgery.", category: "Medical" },
  { word: "arrhythmia", definition: "Irregular heartbeat", sentence: "The doctor diagnosed the patient with arrhythmia.", category: "Medical" },
  { word: "asphyxiation", definition: "Suffocation", sentence: "Smoke inhalation can cause asphyxiation.", category: "Medical" },
  { word: "defibrillator", definition: "Device to restart heart", sentence: "The defibrillator shocked the heart back to normal.", category: "Medical" },
  { word: "esophagus", definition: "Tube from throat to stomach", sentence: "Food travels down the esophagus to the stomach.", category: "Medical" },
  { word: "hemorrhage", definition: "Heavy bleeding", sentence: "The wound caused a severe hemorrhage.", category: "Medical" },
  { word: "otolaryngology", definition: "Study of ear, nose, and throat", sentence: "Otolaryngology is a branch of medicine.", category: "Medical" },
  { word: "pharmaceutical", definition: "Related to drugs", sentence: "The pharmaceutical company makes new medicines.", category: "Medical" },
  { word: "pneumonia", definition: "Lung infection", sentence: "The patient recovered from pneumonia.", category: "Medical" },
  { word: "schizophrenia", definition: "Mental disorder", sentence: "The psychiatrist treats patients with schizophrenia.", category: "Medical" },

  // Law Enforcement & Legal
  { word: "affidavit", definition: "Sworn written statement", sentence: "The witness signed an affidavit in court.", category: "Law Enforcement & Legal" },
  { word: "arraignment", definition: "Formal reading of charges", sentence: "The arraignment happened in the courtroom.", category: "Law Enforcement & Legal" },
  { word: "criminology", definition: "Study of crime", sentence: "Criminology helps understand criminal behavior.", category: "Law Enforcement & Legal" },
  { word: "forensic", definition: "Related to legal evidence", sentence: "Forensic scientists examine crime scenes.", category: "Law Enforcement & Legal" },
  { word: "incarceration", definition: "Being in prison", sentence: "Incarceration is punishment for serious crimes.", category: "Law Enforcement & Legal" },
  { word: "jurisdiction", definition: "Legal authority over an area", sentence: "The court has jurisdiction over this case.", category: "Law Enforcement & Legal" },
  { word: "litigation", definition: "Legal proceedings", sentence: "The litigation lasted for several years.", category: "Law Enforcement & Legal" },
  { word: "recidivism", definition: "Repeating criminal behavior", sentence: "Programs aim to reduce recidivism rates.", category: "Law Enforcement & Legal" },
  { word: "subpoena", definition: "Legal order to appear", sentence: "The subpoena required the witness to testify.", category: "Law Enforcement & Legal" },
  { word: "surveillance", definition: "Close observation", sentence: "Police use surveillance cameras to watch the streets.", category: "Law Enforcement & Legal" },

  // Church & Religious
  { word: "apocalypse", definition: "Catastrophic event", sentence: "Many stories talk about the apocalypse.", category: "Church & Religious" },
  { word: "catechism", definition: "Religious instruction", sentence: "The catechism teaches about faith.", category: "Church & Religious" },
  { word: "deuteronomy", definition: "Book of the Bible", sentence: "Deuteronomy contains important laws.", category: "Church & Religious" },
  { word: "ecclesiastical", definition: "Related to the church", sentence: "Ecclesiastical leaders guide the community.", category: "Church & Religious" },
  { word: "eucharist", definition: "Religious ceremony", sentence: "The eucharist is an important ritual.", category: "Church & Religious" },
  { word: "hallelujah", definition: "Expression of praise", sentence: "People sing hallelujah in church.", category: "Church & Religious" },
  { word: "hymn", definition: "Religious song", sentence: "The choir sings hymns during service.", category: "Church & Religious" },
  { word: "omniscient", definition: "Knowing everything", sentence: "God is often described as omniscient.", category: "Church & Religious" },
  { word: "psalm", definition: "Sacred poem", sentence: "The psalm is a beautiful prayer.", category: "Church & Religious" },
  { word: "sacrilegious", definition: "Disrespecting sacred things", sentence: "Stealing from a church is sacrilegious.", category: "Church & Religious" },

  // Linguistic Curiosities
  { word: "anemone", definition: "Marine animal or flower with delicate petals", sentence: "The sea anemone looks like an underwater flower.", category: "Linguistic Curiosities" },
  { word: "betwixt", definition: "Between", sentence: "The treasure lies betwixt the two trees.", category: "Linguistic Curiosities" },
  { word: "bourgeois", definition: "Middle class", sentence: "The bourgeois family lives in a nice house.", category: "Linguistic Curiosities" },
  { word: "draught", definition: "Current of air", sentence: "I feel a cold draught coming through the window.", category: "Linguistic Curiosities" },
  { word: "faux pas", definition: "Social mistake", sentence: "Spilling wine was a faux pas at dinner.", category: "Linguistic Curiosities" },
  { word: "hors d'oeuvre", definition: "Appetizer", sentence: "We ate hors d'oeuvre before dinner.", category: "Linguistic Curiosities" },
  { word: "Odysseus", definition: "Greek hero who took ten years returning home from Troy", sentence: "Odysseus tricked his enemies by hiding inside a wooden horse.", category: "Linguistic Curiosities" },
  { word: "Penelope", definition: "Odysseus's wife who waited faithfully for twenty years", sentence: "Penelope wove and unwove a blanket to delay choosing a new husband.", category: "Linguistic Curiosities" },
  { word: "pho", definition: "Vietnamese noodle soup", sentence: "I ordered a hot bowl of pho with beef and noodles.", category: "Linguistic Curiosities" },
  { word: "rendezvous", definition: "Meeting place", sentence: "They had a rendezvous at the park.", category: "Linguistic Curiosities" },
  { word: "schadenfreude", definition: "Pleasure from others' misfortune", sentence: "Feeling schadenfreude is not kind.", category: "Linguistic Curiosities" },
  { word: "thou", definition: "You (archaic)", sentence: "Thou shalt not steal.", category: "Linguistic Curiosities" },
  { word: "victuals", definition: "Food supplies", sentence: "The ship carried victuals for the voyage.", category: "Linguistic Curiosities" },
  { word: "yonder", definition: "Over there", sentence: "Look at the mountain yonder.", category: "Linguistic Curiosities" },

  // Bonus: Slang Words
  { word: "aura", definition: "Personal vibe or energy", sentence: "She has a cool aura that everyone likes.", category: "Bonus: Slang Words" },
  { word: "bet", definition: "Agreement or confirmation", sentence: "Bet, I'll meet you at the park.", category: "Bonus: Slang Words" },
  { word: "cap", definition: "Lie or exaggeration", sentence: "No cap, that's the best movie ever.", category: "Bonus: Slang Words" },
  { word: "cook", definition: "To perform well", sentence: "Let him cook with his new dance moves.", category: "Bonus: Slang Words" },
  { word: "drip", definition: "Stylish appearance", sentence: "Your outfit has serious drip.", category: "Bonus: Slang Words" },
  { word: "ghost", definition: "To stop communicating", sentence: "He ghosted me after our date.", category: "Bonus: Slang Words" },
  { word: "glaze", definition: "To compliment excessively", sentence: "Don't glaze me with fake praise.", category: "Bonus: Slang Words" },
  { word: "rizz", definition: "Charisma or charm", sentence: "He has rizz that wins everyone over.", category: "Bonus: Slang Words" },
  { word: "stan", definition: "Dedicated fan", sentence: "I'm a huge stan of that singer.", category: "Bonus: Slang Words" },
  { word: "sus", definition: "Suspicious", sentence: "That story sounds really sus.", category: "Bonus: Slang Words" }
]
