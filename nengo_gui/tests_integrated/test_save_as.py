import inspect
import os
import time

import nengo_gui
from . import reset_page


def download_file(driver, name_of_file):
    file_name = driver.find_element_by_xpath('//*[@id="filename"]')
    file_name.click()
    time.sleep(0.25)

    field = driver.find_element_by_xpath('//*[@id="save-as-filename"]')
    time.sleep(0.3)
    field.clear()
    time.sleep(0.25)
    field.send_keys(name_of_file)
    time.sleep(0.2)

    accept = driver.find_element_by_xpath('//*[@id="OK"]')
    accept.click()

    time.sleep(5)


def test_save_as(driver):
    # Saves the default.py file as test_download, tests whether it downloaded
    # correctly.
    reset_page(driver)
    download_file(driver, "nengo_gui/examples/test_download.py")

    # Finds files to be read
    project_root = os.path.dirname(inspect.getfile(nengo_gui))
    examples = os.path.join(project_root, "examples")
    test_file = os.path.join(examples, "test_download.py")
    test_file_conf = os.path.join(examples, "test_download.py.cfg")
    default_file = os.path.join(examples, "default.py")

    assert(os.path.isfile(test_file))
    with open(test_file, 'r') as f1:
        test_code = f1.read()
    with open(default_file, 'r') as f2:
        default_code = f2.read()

    assert test_code == default_code

    # Deletes downloaded files
    os.remove(test_file)
    os.remove(test_file_conf)

    time.sleep(1)
    download_file(driver, "nengo_gui/examples/default.py")
    time.sleep(2)
    try:
        alert = driver.switch_to_alert()
        alert.accept()
    except:
        assert False, "No warning present"
