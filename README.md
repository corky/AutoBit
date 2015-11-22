# AutoBit

The LinkItOne directory contains the files need to run the LinkItOne device as the AutoBit, Automobile Activity Tracker.

The NodeJS directory contains the backend application server that the AutoBit device communicates with.

The case directory contains the files needed to print the case for the AutoBit on a 3d printer.

###Backend Service setup
1)  Run npm install to get the necessary dependancies installed
  
2) modify the appServer.js to the publically accessible IP address of the computer you are deploying the backend service  on.  Look for YOUR_PUBLIC_IPADDRESS_HERE and replace it with your IP address.
  
3) start the service by typing <B>nodejs appServer.js</B>.   On some devices (like a raspberry pi) you need to be administrator   to start a node JS service that binds to a public IP address.  In that case run <B>sudo nodejs appServer.js</B>
  
4) there is a sql script to load sample data into your nodeJS service/database if you wish, to play around with the UI.   
  
  run <B>sqlite3 gpsDatabase.db < sampledata.sql</B>

5) you can test the nodeJS rest service by running the following commands in a tool like Postman.
  
  POST http://IP_ADDRESS_OF_BACKEND_SERVICE:9082/logs
  { "startTime" : 1447350771, "startLon" : "118.369052W", "startLat" : "34.051655N", "endTime" : 1447350794, "endLon" : "118.369052W", "endLat" : "34.051655N" }

  GET http://IP_ADDRESS_OF_BACKEND_SERVICE:9082/logs

###LinkIt One setup

1) Setup your linkit one development environment within the Arduino IDE.

2) Load the AutoBit.ino file in the IDE.   Configure the sketch with your local environment settings including:  WIFI name, WIFI password, and the IP Address of the backend server the AutoBit will communicate with.  (This will be the IP address of where you deployed the NodeJS Server above.

3) Compile and upload your sketch to the LinkIt One
