// Function to calculate time difference in "time ago" format
export function timeAgo(timestamp) {
  const now = new Date();
  const savedTime = new Date(timestamp);
  const secondsAgo = Math.floor((now.getTime() - savedTime.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(secondsAgo / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

export function getNextID(elements, type = undefined) {
  // Filter the elements array: if a type is specified, include only elements of that type; otherwise, use all elements
  const filteredElement = type
    ? elements.filter((element) => element.type === type)
    : elements;

  // Compute the next ID:
  // 1. Map each element to its id converted to a number.
  // 2. Use Math.max to find the highest ID number. Start comparison with -1 to handle an empty array scenario.
  // 3. Add 1 to the highest ID to generate the next ID.
  return (
    Math.max(...filteredElement.map((element) => Number(element.data.id)), -1) +
    1
  );
}

export function extractObjectTypes(
  dataTypes,
  objectType,
  edgeParent,
  existingTypes,
  isUpdating,
) {
  // Return early if dataTypes is false or doesn't have the key objectType
  if (!dataTypes || !dataTypes[objectType]) {
    return [];
  }

  if (dataTypes && dataTypes[objectType]) {
    if (objectType === "situation") {
      const keepTypes = new Set(
        existingTypes.filter(
          (type) =>
            (type !== "initial" && type !== "terminal") || type === isUpdating
        )
      );

      // Add 'initial' and 'terminal' if not updating and they're missing
      if (!isUpdating) {
        ["initial", "terminal"].forEach((type) => {
          if (!existingTypes.includes(type)) keepTypes.add(type);
        });
      }

      // Always include 'safe' and 'unresolved'
      ["safe", "unresolved"].forEach((type) => keepTypes.add(type));

      return dataTypes[objectType].filter(
        (type) =>
          !["dangerous", "compromised"].includes(type.name) &&
          keepTypes.has(type.name)
      );
    } else if (objectType === "event") {
      const keepTypes = new Set(["generic"]);

      if (edgeParent?.type === "situation") {
        switch (edgeParent.data.nodeType) {
          case "dangerous":
            keepTypes.add("detection");
            keepTypes.delete("generic");
            break;
          case "safe":
            keepTypes.add("divergent");
            keepTypes.add("threat");
            break;
        }
      }
      return dataTypes[objectType].filter((type) => keepTypes.has(type.name));
    }

    // Return all object types as no specific filters are applied beyond this
    return dataTypes[objectType];
  }
}