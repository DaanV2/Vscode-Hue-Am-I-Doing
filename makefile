

download-icons:
	curl -L https://developers.meethue.com/wp-content/uploads/2023/01/hueiconpack.zip -o icons.zip \
	unzip icons.zip -d assets/hue-icons

setup: download-icons
	npm install
