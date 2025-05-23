import subprocess
import pickle

def insecure_eval():
    user_input = input("Enter code: ")
    eval(user_input)  # B101 - Use of eval detected

def insecure_pickle():
    data = pickle.loads(b"malicious-payload")  # B301 - Pickle load

def insecure_shell():
    subprocess.call("ls -l", shell=True)  # B602 - shell=True

def hardcoded_password():
    password = "hunter2"  # B105 - Possible hardcoded password

def insecure_exec():
    exec("print('Dangerous exec')")  # B102 - Use of exec detected

    