#include <LGPS.h>
#include <LDateTime.h>
#include <LSD.h> 
#include <LWiFi.h>
#include <LWiFiServer.h>
#include <LWiFiClient.h>

//vv---Configuration data--vv

//WIFI network attaching to
#define WIFI_AP "YOUR_WIFI_NETWORK_NAME_HERE"
#define WIFI_PASSWORD "YOUR_WIFI_NETWORK_PASSWORD_HERE"
#define WIFI_AUTH LWIFI_WPA  

//REST server hosting our data
char server[] = "IPADDRESS_OF_BACKEND_SERVER";
int port = 9082;  //PORT ADDRESS OF BACKEND SERVER 
//LED pins
int powerPin = 3;   
int gpsPin = 2;
int wifiPin = 5;
int dataPin = 6;
int serverPin = 7;
//misc config values
int timeThreshold = 120;  //ONLY LOG TRIPS AND DRIVES OVER xx seconds
int maxDataFiles = 120;  //MAX FILES LINKIT ONE HOLDS ON TO

//^^---Configuration data--^^

//global variables
datetimeInfo t;
boolean connectedToServer = false;
gpsSentenceInfoStruct info;
float currentLatitude;
float currentLongitude;
char currentLatitudeDir;
char currentLongitudeDir;
unsigned int currentTime;
char oldData[1000];
char *oldLatitude;
char *oldLongitude;
unsigned int oldTime=0;
unsigned int oldEndTime=0;
unsigned int oldStartTime=0;
unsigned int currentStartTime=0;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);

  //UI setup
  initializeLEDs();

  //setup SD card
  setupSDStorage();
  
  //GPS setup
  initializeGPS();

  //WIFI setup 
  connectWifi(5);  
}

void loop() {
  
  //read the clock
  readClockData();

  //see if we can connect to our backend server via WIFI
  //if so, process data files
  connectedToServer = validateServer();
  if(connectedToServer)
  {
      //upload data
      checkAndUploadData();
  }

  //update LEDs with current status
  updateUI();

  //get current GPS data
  processGPS();

  //if RTC is setup process our previous data
  if(t.year > 2010){
    if(currentStartTime==0)
    {
      currentStartTime = currentTime;
    }

    if(oldTime>0)
    {
      processOldData();    
    }
    else
    {
     if(oldStartTime>0)
     {
       processOldData2();    
     } 
    }
  }
  

  //if our WIFI is not connected, try to connect, otherwise sleep for 2 second
  if(LWiFi.status()!=LWIFI_STATUS_CONNECTED )
  {
     connectWifi(2);
  }
  else
  {
    delay(2000);
  }
}

void initializeGPS()
{
  Serial.println("LGPS Power on, and waiting ..."); 
  LGPS.powerOn();
}

void initializeLEDs()
{
  pinMode(powerPin, OUTPUT);
  pinMode(gpsPin, OUTPUT);
  pinMode(wifiPin, OUTPUT);
  pinMode(dataPin, OUTPUT);
  pinMode(serverPin, OUTPUT);
  digitalWrite(powerPin, HIGH);
  digitalWrite(gpsPin, LOW);
  digitalWrite(wifiPin, LOW);
  digitalWrite(dataPin, LOW);
  digitalWrite(serverPin, LOW);
}

void setupSDStorage()
{
  Serial.print("Initializing SD card...");
  LSD.begin();
  
  //setup directory structure
  if(!LSD.exists("\\GPSTrackLogReport"))
  {
    LSD.mkdir("\\GPSTrackLogReport");
  }
  if(!LSD.exists("\\GPSTrackLogReport\\datatosubmit"))
  {
    LSD.mkdir("\\GPSTrackLogReport\\datatosubmit");
  }
  //check to see if previous location was logged, and if so, read it
  if (LSD.exists("\\GPSTrackLogReport\\currentPosition.txt")) {
    LFile dataFile = LSD.open("\\GPSTrackLogReport\\currentPosition.txt", FILE_READ);
    if (dataFile) {
      int len = dataFile.read(&oldData, 1000);
      dataFile.close();
      parseOldData(oldData);      
    }
  }
}


void parseOldData(char *s)
{
  unsigned int pointFive;
  unsigned int first;
  char *second;
  char *third;
  
  pointFive = atoi(strtok(s, ","));
  first = atoi(strtok(NULL, ","));
  second = strtok(NULL, ",");
  third = strtok(NULL, ",");

  if (pointFive!=0)
    oldStartTime = pointFive;
  if (first!=0)
  {
    oldTime = first;
    oldEndTime = oldTime;
  }
  if (second!=0)
    oldLongitude = second;
  if (third!=0)
    oldLatitude = third;
}

void checkAndUploadData()
{
  char filePath[256];
  char fileBuff[1000];
  unsigned int startTime;
  unsigned int endTime;
  char *startLong;
  char *startLat;
  char *endLong;
  char *endLat;
  boolean success = false;
  
  if(LSD.exists("\\GPSTrackLogReport\\datatosubmit\\datafile1.txt"))
  {
      for(int iloop=1;iloop<maxDataFiles;iloop++)
      {
        sprintf(filePath, "\\GPSTrackLogReport\\datatosubmit\\datafile%d.txt", iloop);
        if(!LSD.exists(filePath))
        {
          sprintf(filePath, "\\GPSTrackLogReport\\datatosubmit\\datafile%d.txt", iloop-1);
          //read data
          LFile dataFile = LSD.open(filePath, FILE_READ);
          if (dataFile) {
            int len = dataFile.read(&fileBuff, 256);
            dataFile.close();
            endTime = atoi(strtok(fileBuff, ","));
            endLong = strtok(NULL, ",");
            endLat = strtok(NULL, ",");
            startTime= atoi(strtok(NULL, ","));
            startLong = strtok(NULL, ",");
            startLat = strtok(NULL, ",");   
            //post data
            success = postDataToServer(startTime, startLong, startLat, endTime, endLong, endLat);
            //if success delete file
            if(success)
            {
              LSD.remove(filePath);
            }
          }          
        }
      }
  }
}

void processOldData()
{
  char newbuff[256];
  char file1[256];
  
  if(oldTime<currentTime)
  {
     
      //only log stoppages over 2 minutes
     if((currentTime-oldTime)>timeThreshold)
     {
       nextFileToWrite(file1);
       LFile dataFile = LSD.open(file1, FILE_WRITE);
       if (dataFile) {
          sprintf(newbuff, "%d,%f%c,%f%c,%d,%s,%s,", currentTime, currentLongitude, currentLongitudeDir, currentLatitude, currentLatitudeDir, oldTime, oldLongitude, oldLatitude);
          dataFile.println(newbuff);
          dataFile.close();
          //resetting old time so data is only procssed once.
          oldTime=0;
        }
      }
  }
}

void processOldData2()
{
  char newbuff1[256];
  char file2[256];
  
  if(oldStartTime<currentTime && oldEndTime<currentTime && oldStartTime<oldEndTime)
  {
      //only log stoppages over 2 minutes
     if((oldEndTime-oldStartTime)>timeThreshold)
     {
       nextFileToWrite(file2);
       LFile dataFile1 = LSD.open(file2, FILE_WRITE);
       if (dataFile1) {
          sprintf(newbuff1, "%d,%s,%s,%d,%s,%s,", oldEndTime, "TRAVEL", "TRAVEL", oldStartTime, "TRAVEL", "TRAVEL");
          dataFile1.println(newbuff1);
          dataFile1.close();  
          //resetting old time so data is only procssed once.
          oldStartTime=0;
        }
     }
  }
}


void updateUI()
{
  if(t.year < 2010){
    digitalWrite(gpsPin, LOW);
  }
  else
  {
    digitalWrite(gpsPin, HIGH);
  }
  
  if (LWiFi.status()==LWIFI_STATUS_CONNECTED)
  {
    digitalWrite(wifiPin, HIGH);
  }
  else
  {
    digitalWrite(wifiPin, LOW);
  }

  if(connectedToServer)
  {
    digitalWrite(serverPin, HIGH);
  }
  else
  {
    digitalWrite(serverPin, LOW);
  }

  if(hasFilesToTransfer())
  {
    digitalWrite(dataPin, HIGH);
  }
  else
  {
    digitalWrite(dataPin, LOW);
  }
}

static void nextFileToWrite(char filePath[])
{
  char filePathCheck[256];
  //if over maxDataFiles files in directory unprocessed, overwrite the first constantly
  sprintf(filePath, "\\GPSTrackLogReport\\datatosubmit\\datafile%d.txt", 1);
  for(int iloop=1;iloop<maxDataFiles;iloop++)
  {
    sprintf(filePathCheck, "\\GPSTrackLogReport\\datatosubmit\\datafile%d.txt", iloop);
    if(!LSD.exists(filePathCheck)){
      sprintf(filePath, "\\GPSTrackLogReport\\datatosubmit\\datafile%d.txt", iloop);      
      break;
    }      
  }
}

static boolean hasFilesToTransfer()
{
  if(LSD.exists("\\GPSTrackLogReport\\datatosubmit\\datafile1.txt"))
  {
    return true;
  }
  else
  {
    return false;
  }
}

static boolean validateServer()
{
  char action[] = "GET "; 
  char path[] = "/status";
  LWiFiClient wifiClient;
  //Serial.println("Validate WIFI");
  if (LWiFi.status()==LWIFI_STATUS_CONNECTED)
  {
    digitalWrite(serverPin, LOW);
    int errorcount = 0;
    while(!wifiClient.connect(server, port))
    {
      errorcount += 1;
      if (errorcount > 10) {
        wifiClient.stop();
        return false;
      }
      delay(500);
    }
    wifiClient.print(action);                   
    wifiClient.print(path);           
    wifiClient.println(" HTTP/1.1"); 
    wifiClient.println("Connection: close");
    wifiClient.println();
    delay(500);
     
    errorcount = 0;
    while (!wifiClient.available())
      {
        errorcount += 1;
        if (errorcount > 10) {
          wifiClient.stop();
          return false;
        }
        delay(100);
    }
    char d;
    int bufcnt=0;
    char httpbuff[1400];
    while (wifiClient)
    {
      int v = wifiClient.read();
      if (v != -1)
      {
        d = v;
        if(bufcnt<1400)
        {
            httpbuff[bufcnt++] = d;
        }
      }
      else
      {
        wifiClient.stop();    
      } 
    }
    
    String myresult(httpbuff);
    myresult.remove(15);
    if(myresult = "HTTP/1.1 200 OK")
    {
      digitalWrite(serverPin, HIGH);
      return true;
    }
    else
    {
      return false;
    }
  }
  else
  {
    return false;
  }
}


static boolean postDataToServer(unsigned int startTime, char* startLon, char* startLat, unsigned int endTime, char* endLon, char* endLat)
{
  char action[] = "POST ";  
  char path[] = "/logs";  
  LWiFiClient wifiClient;
  char postData[200];
  char postDataHeader[200];
  String postDataString;
  String postDataHeaderString;
  
  if (LWiFi.status()==LWIFI_STATUS_CONNECTED)
  {
    Serial.print("Posting data to server...");
    digitalWrite(serverPin, LOW);
    int errorcount = 0;
    while(!wifiClient.connect(server, port))
    {
      errorcount += 1;
      if (errorcount > 10) {
        wifiClient.stop();
        Serial.println("Failure1");
        return false;
      }
      delay(500);
    }
 
    sprintf(postData, "\n{ \"startTime\" : %d, \"startLon\" : \"%s\", \"startLat\" : \"%s\", \"endTime\" : %d, \"endLon\" : \"%s\", \"endLat\" : \"%s\" }",startTime, startLon, startLat, endTime, endLon, endLat);
    postDataString = String(postData);
    sprintf(postDataHeader, "Content-Length: %d",postDataString.length());
    postDataHeaderString = String(postDataHeader);    
    wifiClient.print(action);                   
    wifiClient.print(path);           
    wifiClient.println(" HTTP/1.1");    
    wifiClient.println("Content-Type: application/json"); 
    wifiClient.println(postDataHeaderString); 
    wifiClient.println(postDataString);
    wifiClient.println((char)26);

    char d;
    int bufcnt=0;
    char httpbuff[1400];
    
    while (wifiClient)
    {
      int v = wifiClient.read();
      if (v != -1)
      {
        d = v;
        if(bufcnt<1400)
        {
            httpbuff[bufcnt++] = d;
        }
      }
      else
      {
        wifiClient.stop();    
      } 
    }
    
    String myresult(httpbuff);
    myresult.remove(15);
    if(myresult = "HTTP/1.1 200 OK")
    {
      digitalWrite(serverPin, HIGH);
      Serial.println("Success");
      return true;
    }
    else
    {
      Serial.println("Failure3");
      return false;
    }
  }
  else
  {
    Serial.println("Failure4");
    return false;
  }
}


void connectWifi(int tries)
{
  int counter=tries;
  Serial.println("Connecting to WIFI");
  LWiFi.connect(WIFI_AP, LWiFiLoginInfo(WIFI_AUTH, WIFI_PASSWORD));
  while (LWiFi.status()!=LWIFI_STATUS_CONNECTED && counter<5)
  {
    counter++;
    delay(1000);
  }

  if(LWiFi.status()!=LWIFI_STATUS_CONNECTED )
  {
    Serial.println("WIFI Failed");
  }
  else
  {
    Serial.println("WIFI Success");
  }
}

void processGPS()
{
  char mybuff[256];

  LGPS.getData(&info);
  
  boolean fixed = processGPGGA((char*)info.GPGGA);

  if(fixed)
  {
    //write our current position incase the power is turned off
    if (LSD.exists("\\GPSTrackLogReport\\currentPosition.txt")) {
      LSD.remove("\\GPSTrackLogReport\\currentPosition.txt");
    }
    LFile dataFile = LSD.open("\\GPSTrackLogReport\\currentPosition.txt", FILE_WRITE);
    if (dataFile) {
      sprintf(mybuff, "%d,%d,%f%c,%f%c,", currentStartTime, currentTime, currentLongitude, currentLongitudeDir, currentLatitude, currentLatitudeDir);
      dataFile.println(mybuff);
      dataFile.close();
    }
  }
}

/** REAL TIME CLOCK AND GPS CODE **/
void readClockData()
{
  LDateTime.getTime(&t);
  LDateTime.getRtc(&currentTime);
}

void printClockData()
{
  Serial.print("Current GMT: ");
  Serial.print(t.mon);
  Serial.print("/");
  Serial.print(t.day);
  Serial.print("/");
  Serial.print(t.year);
  Serial.print(" ");
  Serial.print(t.hour);
  Serial.print(":");
  Serial.print(t.min);
  Serial.print(":");
  Serial.print(t.sec);
  Serial.print(" Seconds since 1/1/1970 GMT: ");
  Serial.println(currentTime);
}

boolean processGPGGA(char* str)
{
  char SMScontent[160];
  char latitude[20];
  char lat_direction[1];
  char longitude[20];
  char lon_direction[1];
  char buf[20];
  char time[30];
  const char* p = str;
  p = nextToken(p, 0); // GGA
  p = nextToken(p, time); // Time
  p = nextToken(p, latitude); // Latitude
  p = nextToken(p, lat_direction); // N or S?
  p = nextToken(p, longitude); // Longitude
  p = nextToken(p, lon_direction); // E or W?
  p = nextToken(p, buf); // fix quality
  if (buf[0] == '1')
  {
    p = nextToken(p, buf);   
    const int coord_size = 8;
    char lat_fixed[coord_size],lon_fixed[coord_size];
    convertCoords(latitude,longitude,lat_fixed, lon_fixed,coord_size);

    currentLatitude = arrayToFloat(lat_fixed);
    currentLatitudeDir = lat_direction[0];
    currentLongitude = arrayToFloat(lon_fixed);
    currentLongitudeDir = lon_direction[0];

    return true;
  }
  else
  {
    //Serial.println("GPS is not fixed yet.");
    return false;
  }
}

void convertCoords(const char* latitude, const char* longitude, char* lat_return, char* lon_return, int buff_length)
{
  char lat_deg[3];
  strncpy(lat_deg,latitude,2);      //extract the first 2 chars to get the latitudinal degrees
  lat_deg[2] = 0;                   //null terminate
  
  char lon_deg[4];
  strncpy(lon_deg,longitude,3);      //extract first 3 chars to get the longitudinal degrees
  lon_deg[3] = 0;                    //null terminate
  
  int lat_deg_int = arrayToInt(lat_deg);    //convert to integer from char array
  int lon_deg_int = arrayToInt(lon_deg);
  
  // must now take remainder/60
  //this is to convert from degrees-mins-secs to decimal degrees
  // so the coordinates are "google mappable"
  
  float latitude_float = arrayToFloat(latitude);      //convert the entire degrees-mins-secs coordinates into a float - this is for easier manipulation later
  float longitude_float = arrayToFloat(longitude);
  
  latitude_float = latitude_float - (lat_deg_int*100);      //remove the degrees part of the coordinates - so we are left with only minutes-seconds part of the coordinates
  longitude_float = longitude_float - (lon_deg_int*100);
  
  latitude_float /=60;                                    //convert minutes-seconds to decimal
  longitude_float/=60;
  
  latitude_float += lat_deg_int;                          //add back on the degrees part, so it is decimal degrees
  longitude_float+= lon_deg_int;
  
  snprintf(lat_return,buff_length,"%2.3f",latitude_float);    //format the coordinates nicey - no more than 3 decimal places
  snprintf(lon_return,buff_length,"%3.3f",longitude_float);
}

int arrayToInt(const char* char_array)
{
  int temp;
  sscanf(char_array,"%d",&temp);
  return temp;
}

float arrayToFloat(const char* char_array)
{
  float temp;
  sscanf(char_array, "%f", &temp);
  return temp;
}

const char *nextToken(const char* src, char* buf)
{
  int i = 0;
  while (src[i] != 0 && src[i] != ',')
  i++;
  if (buf)
  {
    strncpy(buf, src, i);
    buf[i] = 0;
  }
  if (src[i])
  i++;
  return src + i;
}



