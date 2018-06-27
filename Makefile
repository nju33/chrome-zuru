zip:
	[ -e "extension.zip" ] && rm extension.zip || :
	zip -r extension.zip ext/* -x *dist* -x *node_modules* *.cache*