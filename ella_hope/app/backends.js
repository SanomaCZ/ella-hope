function getBackendName(baseUrl, backendsUrls) {
	var backend;
	for (i in backendsUrls) {
		if (backendsUrls[i].url == baseUrl) {
			backend = backendsUrls[i].name;
			break;
		}
		
	}
	return backend;
}