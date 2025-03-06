import { useEffect, useState } from "react";

// Import CSS for styling the side panel and necessary icons/components
import "./SidePanel.css";
import { HiHome } from "react-icons/hi2";
import { FaSearch } from "react-icons/fa";
import { TbEdit } from "react-icons/tb";

// Import hooks to access nodes and edges in the React flow graph
import { useNodes, useEdges } from "@xyflow/react";
import { handleNavLinkClick, timeAgo } from "../components/common";

// Function to create a table for each data category
const Table = ({ title, data, setState }) => {
  const isSituation = title === "Situations";
  const isRelationship = title === "Relationships";

  return (
    <div className="space-y-2">
      <p className="font-bold text-xs text-[#34AAE1] text-left">{title}</p>

      <div className="border rounded-lg shadow-lg shadow-[#dfebf5] overflow-hidden border-[#34AAE1] border-opacity-25">
        {data.length === 0 ? (
          <div className="text-black/50 text-center text-xs py-4 tracking-wide">
            No {title} found
          </div>
        ) : (
          <table className="min-w-full divide-y divide-[#34AAE1] bg-[#deecfc] divide-opacity-25 text-xs table-auto">
            <thead className="text-black/40 text-left">
              <tr className="font-['Figtree']">
                <th className="text-center py-2 pl-2 pr-2 w-10">S.N.</th>
                <th className="pl-1 flex-grow">Name</th>

                {(isSituation || !isRelationship) && (
                  <th className="whitespace-nowrap w-20">Type</th>
                )}

                {!isSituation && (
                  <th className="whitespace-nowrap text-center w-20">
                    Probability
                  </th>
                )}

                <th className="w-7" />
              </tr>
            </thead>
            <tbody>
              {data.map((instance, index) => (
                <tr
                  key={instance.id} // Ensures unique key for each row
                  className="odd:bg-[#f0f3f7]/40 even:bg-white/50 text-left text-black whitespace-nowrap"
                >
                  <td className="text-center opacity-60">{index + 1}.</td>

                  <td className="capitalize py-1.5 truncate max-w-[7rem] pr-4 pl-2">
                    {isSituation ? instance.label : instance.data?.label}
                  </td>

                  {!isSituation && !isRelationship && (
                    <td className="capitalize !p-1.5 col-1">
                      {instance.data?.nodeType}
                    </td>
                  )}

                  <td
                    className={"capitalize " + (!isSituation && "text-center")}
                  >
                    {isSituation
                      ? instance.data?.nodeType
                      : instance.data?.probability}
                  </td>

                  <td
                    className="pr-2 cursor-pointer text-[#34AAE1]/30  hover:text-[#34AAE1] hover:!border-1 hover:!border-[#34AAE1]"
                    onClick={() => {
                      setState({
                        visible: true,
                        data: instance,
                      });
                    }}
                  >
                    <TbEdit size={15} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export function SidePanel({
  filename,
  updateState,
  setNodeDialogState,
  setEdgeDialogState,
}) {
  const nodes = useNodes(); // Retrieve nodes data from the graph
  const edges = useEdges(); // Retrieve edges data from the graph
  const [searchTerm, setSearchTerm] = useState("");

  // Local state to store different data categories for display in tables
  const [state, setState] = useState({
    situations: [],
    events: [],
    relationships: [],
  });

  const [lastSavedText, setLastSavedText] = useState(
    "Last Saved " + timeAgo(sessionStorage.getItem("lastSaved"))
  );

  window.addEventListener("sessionStorageUpdate", () => {
    setLastSavedText(
      "Last Saved " + timeAgo(sessionStorage.getItem("lastSaved"))
    );
  });

  // Update last saved every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSavedText(
        "Last Saved " + timeAgo(sessionStorage.getItem("lastSaved"))
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const addProbability = (type) => {
    // Adds probability to nodes based on the edge data, filtering nodes by type
    return nodes
      .filter((node) => node.type === type)
      .map((node) => {
        const currentEdgeData = edges.find((edge) => edge.target === node.id);
        return {
          ...node,
          data: {
            ...node.data,
            label: node.data.label,
            probability:
              currentEdgeData.data.probability &&
              currentEdgeData.data.secondaryProbability
                ? `${currentEdgeData.data.probability}, ${currentEdgeData.data.secondaryProbability}`
                : currentEdgeData.data.probability
                ? currentEdgeData.data.probability
                : "",
          },
        };
      });
  };

  // Updates tables based on current nodes and edges data
  function updateStateTables() {
    // Set data for each table category
    setState({
      situations: nodes.filter((node) => node.type === "situation"),
      events: addProbability("event"),
      relationships: edges.filter((edge) =>
        ["action", "crash"].includes(edge.type)
      ),
    });
  }

  useEffect(() => {
    updateStateTables(); // Trigger table update on component mount or updateState change
  }, [updateState]);

  useEffect(() => {
    // Filter data based on search term
    const filteredSituations = nodes
      .filter((node) => node.type === "situation")
      .filter((situation) =>
        (situation.data.label as string)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );

    const filteredEvents = addProbability("event").filter((event) =>
      (event.data.label as string)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    const filteredRelationships = edges
      .filter((edge) => ["action", "crash"].includes(edge.type))
      .filter((relationship) =>
        (relationship.data.label as string)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );

    setState({
      situations: filteredSituations,
      events: filteredEvents,
      relationships: filteredRelationships,
    });
  }, [searchTerm]);

  return (
    <div className="pb-6 pl-5 pr-4 overflow-auto scrollbar h-screen bg-[#F6F6F6] relative">
      <div className="pt-4 space-y-6">
        <div className="justify-between grid grid-cols-9 gap-6">
          <div
            className="p-2 rounded-2xl space-x-3 col-span-2 flex justify-center items-center border-2 border-[#34AAE1]/60 text-[#34AAE1]/70 hover:border-[#34AAE1] hover:bg-[#34AAE1] hover:text-white controlButtonTooltip cursor-pointer duration-300 transition-colors"
            onClick={() => handleNavLinkClick("")}
          >
            <HiHome size={12} />
          </div>

          {/* File name and last saved time */}
          <div className="flex flex-col space-y-1 text-[#236f92] col-span-7">
            <div className="font-bold font-['Figtree'] tracking-wide whitespace-nowrap truncate w-full capitalize">
              {filename}
            </div>

            <div className="text-2xs opacity-70 capitalize">
              {lastSavedText}
            </div>
          </div>
        </div>

        <div className="flex items-center w-[100%] border-2 border-[#34AAE1]/60 text-[#34AAE1]/70 hover:border-[#34AAE1] px-3 py-2 rounded-xl overflow-hidden group">
          <FaSearch
            className="absolute text-[#34AAE1]/70 group-hover:text-[#34AAE1]"
            size={12}
          />

          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-black pl-6 outline-none bg-transparent w-full tracking-wider text-xs h-full "
          />
        </div>

        <Table
          title="Situations"
          data={state.situations}
          setState={setNodeDialogState}
        />
        <Table
          title="Events"
          data={state.events}
          setState={setNodeDialogState}
        />
        <Table
          title="Relationships"
          data={state.relationships}
          setState={setEdgeDialogState}
        />
      </div>
    </div>
  );
}
