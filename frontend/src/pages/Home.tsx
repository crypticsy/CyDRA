import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTextInput, dialogClassName } from "../components/dialogs";
import {
  timeAgo,
  createProgressSpinner,
  fetchJsonData,
  handleProjectLink,
  deleteProject,
} from "../components/common";

import packageJson from "../../package.json";

import { CiCirclePlus } from "react-icons/ci";
import { MdDeleteOutline } from "react-icons/md";

import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";

const cardDefaultClass =
  "md:h-[28vh] sm:h-[25vh] rounded-xl shadow-lg shadow-[#d6ecff] border bg-[#d6ecff] border-[#34AAE1] hover:transform hover:scale-105 transition-transform";

export function Home() {
  const navigate = useNavigate();
  const [projectsList, setProjectsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isVisible, setIsVisible] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [displayErrorMessage, setDisplayErrorMessage] = useState("");

  const [confirmationDialogState, setConfirmationDialogState] = useState({
    visible: false,
    projectName: "",
  });

  const toast = useRef<Toast>(null);

  function resetDialog() {
    setIsVisible(false);
    setProjectName("");
    setDisplayErrorMessage("");
  }

  function resetConfirmationDialog() {
    setConfirmationDialogState({
      visible: false,
      projectName: "",
    });
  }

  // Fetches graph and vocabulary data asynchronously
  const fetchData = async () => {
    try {
      await Promise.all([
        fetchJsonData("getAllProjects", setProjectsList), // Fetch and set the list of projects
      ]);
    } catch (error) {
      console.error("Error fetching data:", error); // Logs any data-fetching errors
    } finally {
      setIsLoading(false); // Stop loading once data is fetched
    }
  };

  // Deletes project data from the server
  const deleteProjectFromServer = async (projectName) => {
    try {
      await deleteProject(projectName); // Delete the project
    } catch (error) {
      console.error("Error deleting project:", error); // Logs any deletion errors
    } finally {
      fetchData(); // Fetch updated data after deletion
    }
  };

  useEffect(() => {
    fetchData(); // Invoke data fetching on component mount
  }, []);

  function createCard(id, title, lastUpdated, navigate, lastSaved, toast) {
    return (
      <div
        key={id}
        className={
          cardDefaultClass + " w-full border-opacity-10 hover:border-opacity-35"
        }
      >
        <div className="relative cursor-pointer h-full">
          <div
            className="w-full h-full"
            // onclick routing to the project page
            onClick={() => {
              handleProjectLink(navigate, {
                filename: `${title}.json`,
                lastSaved: lastSaved,
              });
            }}
          >
            <div className="h-[65%] w-full">
              <img
                src="../../public/graph.png"
                alt="Project"
                className="w-full h-full rounded-t-xl opacity-65 object-cover"
              />
            </div>

            <div className="h-[35%] w-full px-5 pt-4 flex flex-col justify-center">
              <div className="w-full flex flex-col space-y-1.5">
                <p className="font-bold capitalize truncate whitespace-nowrap tracking-wide text-black/90">
                  {title}
                </p>
                <p className="text-xs opacity-50">Updated {lastUpdated}</p>
              </div>
            </div>
          </div>

          <MdDeleteOutline
            size={20}
            className="opacity-40 text-black hover:opacity-100 hover:text-red-500 right-4 bottom-4 absolute"
            onClick={() => {
              setConfirmationDialogState({
                visible: true,
                projectName: title,
              });
            }}
          />
        </div>
      </div>
    );
  }

  function handleCreateProjectSubmit() {
    if (projectName === "") {
      setDisplayErrorMessage("Please enter the project name.");
    } else if (
      projectsList.some(
        (project) =>
          project.name.trim().toUpperCase() === projectName.trim().toUpperCase()
      )
    ) {
      setDisplayErrorMessage("A project with the same name already exists.");
    } else {
      resetDialog();
      handleProjectLink(navigate, {
        filename: `${projectName}.json`,
        lastSaved: new Date().toISOString(),
      });
    }
  }

  if (isLoading) return createProgressSpinner(); // Display loading spinner while fetching data

  return (
    <div className="text-black w-full py-8 px-10 overflow-y-scroll h-[100vh]">
      <Toast ref={toast} />

      <div className="min-h-[100%] flex flex-col justify-between">
        <div className="flex flex-col justify-center items-center space-y-10">
          {/* Header Section with Logo and Title */}
          <div className="pt-4 pb-5 flex items-center space-x-4 prevent-select">
            <img src="/cydra.png" alt="CyDRA" className="h-[10vh] w-[10vh]" />
            <div className="space-y-3">
              <p className="text-4xl tracking-widest font-bold">CyDRA</p>
              <p className="font-light text-sm opacity-70 tracking-wider text-center">
                Security by Design
              </p>
            </div>
          </div>

          {/* Main Project section with a button to navigate to the project page */}
          <div className="pt-8 w-full">
            <div className="grid md:grid-cols-4 sm:grid-cols-3 gap-8 px-[10vh]">
              {projectsList
                .sort((a, b) => {
                  // Convert last_saved to Date objects if they are not already, assuming last_saved is a date string or timestamp
                  const dateA = new Date(a.last_saved);
                  const dateB = new Date(b.last_saved);

                  // Sort in descending order
                  return dateB.getTime() - dateA.getTime();
                })
                .map((project, index) => {
                  return createCard(
                    index,
                    project.name,
                    timeAgo(project.last_saved),
                    navigate,
                    project.last_saved,
                    toast
                  );
                })}

              <div
                className={
                  cardDefaultClass +
                  " space-y-5 p-4 bg-opacity-50 border-opacity-30 hover:border-opacity-50 opacity-50 text-[#34AAE1] flex flex-col justify-center items-center hover:opacity-100 cursor-pointer transition-colors"
                }
                onClick={() => setIsVisible(true)}
              >
                <CiCirclePlus size={80} />
                <p className="font-bold">Add New</p>
              </div>
            </div>
          </div>

          <Dialog
            header="New Project"
            headerStyle={{ color: "#34AAE1", fontFamily: "Figtree" }}
            visible={isVisible}
            onHide={() => {
              if (!isVisible) return; // Prevents unnecessary re-rendering
              resetDialog();
            }}
            className={dialogClassName}
            closeOnEscape={true}
            draggable={false}
            modal={true}
          >
            <div className="space-y-6 pt-2">
              {createTextInput(
                "Name",
                projectName,
                setProjectName,
                "Enter the project name",
                (e) => {
                  if (e.key === "Enter") handleCreateProjectSubmit();
                } 
              )}

              <div className="flex items-end justify-between">
                <div className="text-sm my-auto text-red-400">
                  {displayErrorMessage.length > 0 && (
                    <p>* {displayErrorMessage} *</p>
                  )}
                </div>

                <button
                  className="px-4 py-1 rounded-lg bg-lime-600"
                  onClick={handleCreateProjectSubmit}
                >
                  <span className="text-white text-sm">Create</span>
                </button>
              </div>
            </div>
          </Dialog>

          <Dialog
            header="Confirm Deletion"
            headerStyle={{ color: "#34AAE1", fontFamily: "Figtree" }}
            visible={confirmationDialogState.visible}
            onHide={() => {
              if (!confirmationDialogState.visible) return; // Prevents unnecessary re-rendering
              resetConfirmationDialog();
            }}
            className={dialogClassName}
            closeOnEscape={true}
            draggable={false}
            modal={true}
          >
            <div className="space-y-6 pt-2 normal-case">
              <div>
                Are you sure you want to delete the{" "}
                <span className="font-bold text-red-500 capitalize">
                  {confirmationDialogState.projectName}
                </span>{" "}
                project ?
              </div>
              <div className="space-x-6">
                <button
                  className="px-4 py-1.5 rounded bg-red-500"
                  onClick={() => {
                    deleteProjectFromServer(
                      confirmationDialogState.projectName
                    );
                    resetConfirmationDialog();
                  }}
                >
                  <span className="text-white text-sm font-bold">Yes</span>
                </button>
                <button
                  className="px-4 py-1.5 rounded bg-lime-600"
                  onClick={() => resetConfirmationDialog()}
                >
                  <span className="text-white text-sm font-bold">No</span>
                </button>
              </div>
            </div>
          </Dialog>
        </div>

        {/* Footer Section with Copywrite Information */}
        <div className="flex flex-row justify-between items-center w-full prevent-select font-light text-xs pt-14">
          <div className="text-black/50">v {packageJson.version}</div>
          <div className="text-black/80">
            &copy; {new Date().getFullYear()}. All Rights Reserved by Cyber
            Security Research Centre - London Metropolitan University.
          </div>
        </div>
      </div>
    </div>
  );
}
