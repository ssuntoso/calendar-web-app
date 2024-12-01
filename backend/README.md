# Backend Documentation
## Create Docker Image
This guide will guide you through the process of creating a docker image.

### Pre-requisite
- Doker desktop is installed

### Image Creation
1. use terminal to navigate to /backend folder
2. run `docker build -t callendar-api:v1.0.0`

## Run Calendar API in K8s
This guide will guide you through the process of deploying the Calendar API inside a k8s cluster.

### Pre-requisite
- K8s client install 
- K8s cluster is running
- Calendar API docker image created

### Installation
1. Create a new namespace `kubectl create namespace calendar-api`
2. Create a secret using this command 
```
kubectl -n calendar-api create secret generic db-password --from-literal=db-password=<DB_PASSWORD>
kubectl -n calendar-api create secret generic email-password --from-literal=email-password=<EMAIL_PASSWORD>
kubectl -n calendar-api create secret generic jwt-secret --from-literal=jwt-secret=<JWT_SECRET>
```
3. Apply the `deployment.yaml` and `service.yaml` file 
```
kubectl -n calendar-api apply -f k8s/deployment.yaml
kubectl -n calendar-api apply -f k8s/service.yaml
```
4. To get external ip adderess of the service, use `kubectl -n calendar-api get svc`
5. Use the EXTERNAL-IP:80/ to make a test API call.