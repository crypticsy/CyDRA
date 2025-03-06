# Cydra Server

This is the backend section of the CyDRA project with its main focus on the server-side of the application. The backend is built using Flask, a Python web framework, and it communicates with the frontend using RESTful APIs.

## Pre-requisites

##### Virtual Environment
You can use any virtual environment of your choice, such as Conda or Python’s built-in venv.

For Conda, follow these steps:
```shell
conda create -n cydra python

# activate the conda environment
conda activate cydra
```

For Python’s built-in venv, use:
```shell
python -m venv cydra  

# Activate the virtual environment
source cydra/bin/activate  # On macOS/Linux  
cydra\Scripts\activate     # On Windows 
```

and install the required libraries using the following command:

```shell
pip install -r requirements.txt
```
<br/>


## Usage


```shell
# run the flask application
python app.py
```