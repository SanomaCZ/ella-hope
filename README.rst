==================================
Ella-hope frontend for `ella-hub`_
==================================

.. _`ella-hub`: https://github.com/SanomaCZ/ella-hub
.. _virtualenv: http://docs.python-guide.org/en/latest/starting/install/linux/#virtualenv



Requirements
------------
1. virtualenv_

2. ella-hope
	git clone https://github.com/SanomaCZ/ella-hope.git

3. `ella-hub`_ is running somewhere



Start server
------------

::

	# install virtualenv
	virtualenv env_project
	# set proper virtual environment
	source env_project/bin/activate

	cd ella-hope
	pip install -r requirements.txt
	python manage.py runserver [<ip_address=127.0.0.1>:<port=8000>]

	# to deactivate virtualenv
	deactivate



Contacts
--------
	vladimir.brigant@business-factory.cz
	michal.belica@business-factory.cz
