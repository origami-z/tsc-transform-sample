/**
 * Copy from https://github.com/origami-z/dota-auto-chess-items-recommender/blob/master/scripts/generateSource.ts
 */

const fs = require("fs");
const prettier = require("prettier");

/**
 * Source for items, can be used for computing other properties in `DACItem`
 */
export interface DACItemBase {
  localized_name: string;
  localized_name_zh: string;
  name: string;
  url_image: string;
  id: number;
  tier: number;
  /**
   * Whether an item should be hidden in the tier list
   */
  hidden?: boolean;
  /**
   * Direct recipe of items id
   */
  recipe: Array<number>;
}
export interface DACItem extends DACItemBase {
  /**
   * Items id that could combine to this item
   */
  extensions: Array<number>;
  /**
   * Fully disassembled items id. Will be itself for leaf level items.
   */
  extendedRecipe?: Array<number>;
  /**
   * Items id that this item could combine into
   */
  dependencyOf: Array<number>;
}

function getExtendedRecipe(
  item: DACItem,
  idToItemMap: Map<number, DACItem>
): number[] {
  return [
    ...item.recipe.reduce((all: number[], id: number) => {
      if (idToItemMap.has(id)) {
        const extendedRecipe = getExtendedRecipe(
          idToItemMap.get(id)!,
          idToItemMap
        );
        // all.push(id);
        if (extendedRecipe.length > 0) {
          all.push(...extendedRecipe);
        } else {
          all.push(id);
        }
      }
      return all;
    }, []),
  ];
}

function getFullDescendants(
  item: DACItem,
  idToItemMap: Map<number, DACItem>
): number[] {
  return [
    ...item.recipe.reduce((all: number[], id: number) => {
      if (idToItemMap.has(id)) {
        const descendants = getFullDescendants(
          idToItemMap.get(id)!,
          idToItemMap
        );
        all.push(id);
        all.push(...descendants);
      }
      return all;
    }, []),
  ];
}

const itemsDataCN = require("../src/items/items_auto_chess_zh-CN.json");

console.log("Processing items data, number of items", itemsDataCN.length);

// console.log(itemsDataCN.filter((i) => !i.extendedRecipe));

// const itemsDataWithExtendedRecipe = itemsDataCN.map((i) => ({
//   ...i,
//   extendedRecipe: i.extendedRecipe || [i.id],
// }));

const idToItemMap = new Map();
itemsDataCN.forEach((item) => idToItemMap.set(item.id, item));

const idToExtendedRecipeMap = new Map();
itemsDataCN.forEach((item) => {
  const extendedRecipe = getExtendedRecipe(item, idToItemMap);
  // For a leaf level item, we want extended recipe to be itself
  if (extendedRecipe.length === 0) extendedRecipe.push(item.id);
  idToExtendedRecipeMap.set(item.id, extendedRecipe);
});

console.log({ idToExtendedRecipeMap });

const idToExtensions = new Map();
itemsDataCN.forEach((item) =>
  idToExtensions.set(
    item.id,
    Array.from(new Set(getFullDescendants(item, idToItemMap)))
  )
);

console.log({ idToExtensions });

/**
 * This generates `dependencyOf`
 */
const idToDependencyOfMap = Array.from(idToExtensions.keys()).reduce(
  (map, id) => {
    const extensions = idToExtensions.get(id);
    Array.from(new Set(extensions)).forEach((extensionId) => {
      if (map.has(extensionId)) {
        map.get(extensionId)!.push(id);
      } else {
        map.set(extensionId, [id]);
      }
    });
    return map;
  },
  new Map<number, number[]>()
);
// "dependencyOf": [],
console.log({ idToDependencyOfMap });

// debugger;

const finalData = itemsDataCN.map((item) => ({
  ...item,
  extendedRecipe: idToExtendedRecipeMap.get(item.id),
  dependencyOf: idToDependencyOfMap.get(item.id) || [],
  extensions: idToExtensions.get(item.id),
}));

const data = JSON.stringify(finalData);
const prettyData = prettier.format(data, { parser: "json" });
fs.writeFileSync("./src/items/items_auto_chess_zh-CN.json", prettyData);
// fs.writeFileSync("./scripts/withExtendedRecipe.json", data);
