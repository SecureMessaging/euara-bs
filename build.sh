#! /bin/bash

package_name="euara-bs"
latest_version=`npm show $package_name version`

version=`node -e "var v = '$latest_version'.split('.'); console.log((parseInt(v[0]) || 0) + '.' + (parseInt(v[1]) || 0) + '.' + ((parseInt(v[2]) || 0) + 1))"`
tar_file="$package_name.$version.tar"

echo "Bulding $package_name@$version"

npm-cache install
tsc
sed "3s/.*/  \"version\": \"$version\",/" $BUILD_DIR/package.json > $BUILD_DIR/dist/package.json
sed -i "2s/.*/  \"name\": \"$package_name\",/" $BUILD_DIR/dist/package.json
echo "Creating TAR file: $BUILD_DIR/$tar_file from $BUILD_DIR/dist"
tar -czf $BUILD_DIR/$tar_file --directory="$BUILD_DIR/dist" .
npm publish $BUILD_DIR/$tar_file --access public