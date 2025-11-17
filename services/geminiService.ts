import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This case should not happen in the target environment, but it's good practice.
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generatePartyTasks(): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Vygeneruj 12 zábavných a lehce pikantních úkolů pro párty hru 'Hříšné Příběhy'. Úkoly by měly být krátké (1-2 věty), vhodné pro skupinu dospělých a měly by podněcovat interakci, smích a flirtování. Vycházej z následujících nápadů, ale formuluj je jako plnohodnotné a zajímavé výzvy: Lít pití po noze do úst, eskymácký polibek, francouzský polibek s někým novým, pohlazení vnitřní strany stehna, bodyshot, zašeptat něco neslušného do ucha, lap dance, masáž nohou, masáž ramen, svádět někoho, jemné kousnutí, dát kompliment, olíznout ucho, plácnout po zadku, prozradit tajemství (např. o prvním sexu), napsat něco na něčí tělo, poslepu hledat kolíčky na oblečení, svěřit se s tajemstvím.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              description: "Seznam 12 párty úkolů.",
              items: {
                type: Type.STRING,
                description: "Jeden párty úkol."
              }
            }
          }
        },
        temperature: 0.8
      },
    });

    const jsonString = response.text.trim();
    const parsedResponse = JSON.parse(jsonString);

    if (parsedResponse && Array.isArray(parsedResponse.tasks)) {
      return parsedResponse.tasks;
    } else {
      console.error("Unexpected JSON structure:", parsedResponse);
      throw new Error("Failed to parse tasks from API response.");
    }
  } catch (error) {
    console.error("Error generating party tasks:", error);
    // In case of error, return a fallback list to ensure the app is still usable
    return [
        "Dej někomu francouzský polibek, koho jsi dnes večer ještě nelíbal/a.",
        "Vyber si někoho a dej mu smyslnou masáž ramen po dobu jedné minuty.",
        "Zašeptej někomu do ucha tu největší prasárničku, která tě napadne.",
        "Nech někoho, ať si z tvého těla dá panáka (bodyshot).",
        "Sveď osobu po tvé levici. Máš dvě minuty na to, aby se začervenala.",
        "Plácni někoho dle tvého výběru po zadku.",
        "Jemně kousni někoho do ušního lalůčku.",
        "Svěř se někomu se svým největším tajemstvím nebo pikantní historkou.",
        "Vyber si partnera a dejte si eskymácký polibek.",
        "Nech někoho, ať ti napíše fixou krátký vzkaz na ruku nebo kotník.",
        "Pohlaď někomu vnitřní stranu stehna po dobu deseti sekund.",
        "Slož někomu originální a dvojsmyslný kompliment."
    ];
  }
}