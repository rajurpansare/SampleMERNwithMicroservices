# GCP MERN Application Deployment Using Kubernetes

## Practice Assignment - GCP

This project demonstrates the deployment of a MERN-based microservices application on **Google Cloud Platform (GCP)** using **Google Kubernetes Engine (GKE)**.

The application consists of:

* React frontend
* Node.js / Express `helloService`
* Node.js / Express `profileService`
* MongoDB database
* Docker containers
* Google Artifact Registry
* Kubernetes
* Google Kubernetes Engine (GKE)
* Kubernetes Services
* MongoDB StatefulSet
* Persistent Volume Claim
* Horizontal Pod Autoscaler (HPA)

---

## 1. Application Source

Original application repository:

https://github.com/UnpredictablePrashant/SampleMERNwithMicroservices

Assignment repository:

```text
https://github.com/rajurpansare/SampleMERNwithMicroservices
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username.

---

# 2. Project Architecture

```text
                         Internet
                            |
                            |
                    GCP Load Balancer
                            |
                            v
                 +----------------------+
                 |    React Frontend    |
                 |       + Nginx        |
                 +----------+-----------+
                            |
                 +----------+-----------+
                 |                      |
                 v                      v
        +----------------+     +----------------+
        | hello-service  |     | profile-service|
        |    Port 3001   |     |    Port 3002   |
        +----------------+     +-------+--------+
                                       |
                                       v
                              +----------------+
                              |    MongoDB     |
                              |    Port 27017  |
                              +----------------+
                                       |
                                       v
                              Persistent Storage
```

---

# 3. Application Components

## Frontend

Technology:

* React
* Nginx

Container port:

```text
80
```

Kubernetes Service:

```text
frontend-service
```

Service type:

```text
LoadBalancer
```

---

## Hello Service

Technology:

* Node.js
* Express

Port:

```text
3001
```

Kubernetes Service:

```text
hello-service
```

Health endpoint:

```text
/health
```

---

## Profile Service

Technology:

* Node.js
* Express
* Mongoose

Port:

```text
3002
```

Kubernetes Service:

```text
profile-service
```

Health endpoint:

```text
/health
```

---

## MongoDB

Database:

```text
MongoDB
```

Port:

```text
27017
```

Kubernetes resource:

```text
StatefulSet
```

Storage:

```text
PersistentVolumeClaim
```

---

# 4. Important Frontend Change

The original frontend uses localhost URLs such as:

```javascript
axios.get("http://localhost:3001/")
```

and:

```javascript
axios.get("http://localhost:3002/fetchUser")
```

These URLs work only when the backend is running on the same computer as the browser.

They do not work correctly when the application is deployed to GKE.

Therefore, the URLs were changed to:

```javascript
axios.get("/hello/")
```

and:

```javascript
axios.get("/profile/fetchUser")
```

Nginx then forwards these requests to the Kubernetes backend services.

---

# 5. Prerequisites

Install the following tools:

* Git
* Docker Desktop
* kubectl
* Google Cloud CLI

Verify:

```bash
git --version
```

```bash
docker --version
```

```bash
kubectl version --client
```

```bash
gcloud version
```

---

# 6. GCP Authentication

Login to Google Cloud:

```bash
gcloud auth login
```

Check authenticated accounts:

```bash
gcloud auth list
```

List available GCP projects:

```bash
gcloud projects list
```

Set the required project:

```bash
gcloud config set project YOUR_PROJECT_ID
```

Verify:

```bash
gcloud config get-value project
```

---

# 7. Configure Environment Variables

Set the GCP project:

```bash
export PROJECT_ID=$(gcloud config get-value project)
```

Set the GCP region:

```bash
export REGION="asia-south1"
```

Set the GKE cluster name:

```bash
export CLUSTER="sample-mern-cluster"
```

Set Artifact Registry repository:

```bash
export AR_REPO="sample-mern"
```

Set Kubernetes namespace:

```bash
export NAMESPACE="sample-mern"
```

Verify:

```bash
echo "PROJECT_ID=$PROJECT_ID"
echo "REGION=$REGION"
echo "CLUSTER=$CLUSTER"
echo "AR_REPO=$AR_REPO"
echo "NAMESPACE=$NAMESPACE"
```

---

# 8. Enable Required GCP APIs

Enable Kubernetes Engine:

```bash
gcloud services enable container.googleapis.com
```

Enable Artifact Registry:

```bash
gcloud services enable artifactregistry.googleapis.com
```

Enable Compute Engine:

```bash
gcloud services enable compute.googleapis.com
```

Or enable all together:

```bash
gcloud services enable \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com
```

Verify:

```bash
gcloud services list --enabled | grep -E 'container|artifactregistry|compute'
```

---

# 9. Create Artifact Registry

Create a Docker repository:

```bash
gcloud artifacts repositories create "$AR_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Sample MERN application Docker images"
```

Verify:

```bash
gcloud artifacts repositories list \
  --location="$REGION"
```

---

# 10. Configure Docker Authentication

Configure Docker to authenticate with Artifact Registry:

```bash
gcloud auth configure-docker "${REGION}-docker.pkg.dev"
```

Confirm when prompted.

---

# 11. Clone Application Repository

Clone the original application:

```bash
cd ~/Downloads
```

```bash
git clone https://github.com/UnpredictablePrashant/SampleMERNwithMicroservices.git
```

Enter the project:

```bash
cd SampleMERNwithMicroservices
```

Check the project:

```bash
ls -la
```

Expected structure:

```text
backend/
frontend/
README.md
```

---

# 12. Backend Structure

Check the backend:

```bash
ls -la backend
```

Expected services:

```text
backend/
├── helloService/
└── profileService/
```

Check helloService:

```bash
ls -la backend/helloService
```

Check profileService:

```bash
ls -la backend/profileService
```

---

# 13. Dockerfile - helloService

Create:

```text
backend/helloService/Dockerfile
```

Content:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY index.js ./

ENV PORT=3001

EXPOSE 3001

CMD ["node", "index.js"]
```

---

# 14. Dockerfile - profileService

Create:

```text
backend/profileService/Dockerfile
```

Content:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY index.js ./

ENV PORT=3002

EXPOSE 3002

CMD ["node", "index.js"]
```

---

# 15. Dockerfile - Frontend

Create:

```text
frontend/Dockerfile
```

Content:

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

# 16. Nginx Configuration

Create:

```text
frontend/nginx.conf
```

Content:

```nginx
server {
    listen 80;

    server_name _;

    root /usr/share/nginx/html;

    index index.html;

    location /hello/ {
        proxy_pass http://hello-service:3001/;

        proxy_http_version 1.1;

        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;
    }

    location /profile/ {
        proxy_pass http://profile-service:3002/;

        proxy_http_version 1.1;

        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

---

# 17. Build Docker Images

From the project root:

```bash
docker build \
  -t hello-service:1.0 \
  ./backend/helloService
```

Build profile service:

```bash
docker build \
  -t profile-service:1.0 \
  ./backend/profileService
```

Build frontend:

```bash
docker build \
  -t frontend:1.0 \
  ./frontend
```

Check images:

```bash
docker images | grep -E 'hello-service|profile-service|frontend'
```

---

# 18. Tag Images for Artifact Registry

Tag hello service:

```bash
docker tag hello-service:1.0 \
"${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/hello-service:1.0"
```

Tag profile service:

```bash
docker tag profile-service:1.0 \
"${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/profile-service:1.0"
```

Tag frontend:

```bash
docker tag frontend:1.0 \
"${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/frontend:1.0"
```

Verify:

```bash
docker images | grep "${REGION}-docker.pkg.dev"
```

---

# 19. Push Images to Artifact Registry

Push hello service:

```bash
docker push \
"${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/hello-service:1.0"
```

Push profile service:

```bash
docker push \
"${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/profile-service:1.0"
```

Push frontend:

```bash
docker push \
"${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/frontend:1.0"
```

Verify:

```bash
gcloud artifacts docker images list \
"${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}" \
--include-tags
```

---

# 20. Create GKE Cluster

Create a GKE Autopilot cluster:

```bash
gcloud container clusters create-auto "$CLUSTER" \
  --project="$PROJECT_ID" \
  --location="$REGION"
```

This command may take several minutes.

Verify:

```bash
gcloud container clusters list
```

---

# 21. Connect kubectl to GKE

Get cluster credentials:

```bash
gcloud container clusters get-credentials "$CLUSTER" \
  --location="$REGION" \
  --project="$PROJECT_ID"
```

Check current Kubernetes context:

```bash
kubectl config current-context
```

Check nodes:

```bash
kubectl get nodes
```

---

# 22. Create Kubernetes Namespace

Create:

```bash
kubectl create namespace "$NAMESPACE"
```

Verify:

```bash
kubectl get namespaces
```

---

# 23. MongoDB Kubernetes Deployment

MongoDB is deployed as a StatefulSet because it requires persistent storage.

Apply MongoDB secret:

```bash
kubectl apply -f k8s/mongo-secret.yaml
```

Apply MongoDB StatefulSet:

```bash
kubectl apply -f k8s/mongo.yaml
```

Check:

```bash
kubectl get statefulset -n "$NAMESPACE"
```

Check MongoDB pod:

```bash
kubectl get pods -n "$NAMESPACE"
```

Check persistent storage:

```bash
kubectl get pvc -n "$NAMESPACE"
```

---

# 24. Configure Kubernetes Images

Set image variables:

```bash
export HELLO_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/hello-service:1.0"
```

```bash
export PROFILE_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/profile-service:1.0"
```

```bash
export FRONTEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/frontend:1.0"
```

Verify:

```bash
echo $HELLO_IMAGE
echo $PROFILE_IMAGE
echo $FRONTEND_IMAGE
```

---

# 25. Deploy helloService

Replace the image placeholder:

```bash
sed "s|HELLO_IMAGE|$HELLO_IMAGE|g" \
k8s/hello.yaml > /tmp/hello.yaml
```

Deploy:

```bash
kubectl apply -f /tmp/hello.yaml
```

Check:

```bash
kubectl get deployment -n "$NAMESPACE"
```

Check pods:

```bash
kubectl get pods -n "$NAMESPACE"
```

---

# 26. Deploy profileService

Replace image:

```bash
sed "s|PROFILE_IMAGE|$PROFILE_IMAGE|g" \
k8s/profile.yaml > /tmp/profile.yaml
```

Deploy:

```bash
kubectl apply -f /tmp/profile.yaml
```

Check:

```bash
kubectl get deployment -n "$NAMESPACE"
```

---

# 27. Deploy Frontend

Replace image:

```bash
sed "s|FRONTEND_IMAGE|$FRONTEND_IMAGE|g" \
k8s/frontend.yaml > /tmp/frontend.yaml
```

Deploy:

```bash
kubectl apply -f /tmp/frontend.yaml
```

Check:

```bash
kubectl get pods -n "$NAMESPACE"
```

---

# 28. Check All Kubernetes Resources

Run:

```bash
kubectl get all -n "$NAMESPACE"
```

Also:

```bash
kubectl get pvc -n "$NAMESPACE"
```

And:

```bash
kubectl get secrets -n "$NAMESPACE"
```

---

# 29. Check Kubernetes Services

Run:

```bash
kubectl get svc -n "$NAMESPACE"
```

Expected services:

```text
hello-service
profile-service
mongo-service
frontend-service
```

The frontend service is configured as:

```text
LoadBalancer
```

---

# 30. Get Frontend External IP

Run:

```bash
kubectl get service frontend-service -n "$NAMESPACE"
```

Initially:

```text
EXTERNAL-IP   <pending>
```

Wait a few minutes.

Run again:

```bash
kubectl get service frontend-service -n "$NAMESPACE"
```

Once an external IP appears:

```bash
kubectl get service frontend-service \
-n "$NAMESPACE" \
-o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

Open:

```text
http://YOUR_EXTERNAL_IP
```

in a web browser.

---

# 31. Test helloService

Run:

```bash
kubectl run curl-test \
-n "$NAMESPACE" \
--rm -it \
--restart=Never \
--image=curlimages/curl:8.10.1 \
-- curl -s http://hello-service:3001/health
```

Expected:

```json
{"status":"OK"}
```

---

# 32. Test profileService

Run:

```bash
kubectl run curl-test-profile \
-n "$NAMESPACE" \
--rm -it \
--restart=Never \
--image=curlimages/curl:8.10.1 \
-- curl -s http://profile-service:3002/health
```

Expected:

```json
{"status":"OK"}
```

---

# 33. Check Application Logs

Hello service:

```bash
kubectl logs deployment/hello-service -n "$NAMESPACE"
```

Profile service:

```bash
kubectl logs deployment/profile-service -n "$NAMESPACE"
```

Frontend:

```bash
kubectl logs deployment/frontend -n "$NAMESPACE"
```

MongoDB:

```bash
kubectl logs statefulset/mongo -n "$NAMESPACE"
```

---

# 34. Horizontal Pod Autoscaler

Apply HPA:

```bash
kubectl apply -f k8s/hpa.yaml
```

Check:

```bash
kubectl get hpa -n "$NAMESPACE"
```

Check resource metrics:

```bash
kubectl top pods -n "$NAMESPACE"
```

---

# 35. Test Kubernetes Scaling

Scale hello service to three replicas:

```bash
kubectl scale deployment hello-service \
--replicas=3 \
-n "$NAMESPACE"
```

Check:

```bash
kubectl get pods \
-n "$NAMESPACE" \
-l app=hello-service
```

Return to two replicas:

```bash
kubectl scale deployment hello-service \
--replicas=2 \
-n "$NAMESPACE"
```

---

# 36. Troubleshooting

## Check pods

```bash
kubectl get pods -n "$NAMESPACE"
```

## Describe a pod

```bash
kubectl describe pod POD_NAME -n "$NAMESPACE"
```

## Check logs

```bash
kubectl logs POD_NAME -n "$NAMESPACE"
```

## Check events

```bash
kubectl get events \
-n "$NAMESPACE" \
--sort-by=.lastTimestamp
```

## Check deployment rollout

```bash
kubectl rollout status deployment/hello-service \
-n "$NAMESPACE"
```

```bash
kubectl rollout status deployment/profile-service \
-n "$NAMESPACE"
```

```bash
kubectl rollout status deployment/frontend \
-n "$NAMESPACE"
```

## Check images

```bash
kubectl describe deployment hello-service \
-n "$NAMESPACE" | grep -i image
```

```bash
kubectl describe deployment profile-service \
-n "$NAMESPACE" | grep -i image
```

```bash
kubectl describe deployment frontend \
-n "$NAMESPACE" | grep -i image
```

---

# 37. Screenshot Requirements

The following screenshots should be captured for the assignment.

### GCP

1. GCP login / authenticated account
2. GCP project
3. Enabled APIs
4. Artifact Registry repository
5. Docker images in Artifact Registry

### GKE

6. GKE cluster
7. `kubectl get nodes`
8. Kubernetes namespace
9. Kubernetes pods
10. Kubernetes deployments
11. Kubernetes services
12. MongoDB StatefulSet
13. MongoDB PVC
14. HPA

### Application

15. Hello service health response
16. Profile service health response
17. Frontend application
18. Browser showing GKE external IP

### GitHub

19. GitHub repository
20. Kubernetes YAML files
21. README.md
22. Screenshot documentation

---

# 38. Recommended Repository Structure

```text
sample-mern-gcp-kubernetes/
│
├── README.md
│
├── docker/
│   ├── helloService.Dockerfile
│   ├── profileService.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.conf
│
├── k8s/
│   ├── namespace.yaml
│   ├── mongo-secret.yaml
│   ├── mongo.yaml
│   ├── hello.yaml
│   ├── profile.yaml
│   ├── frontend.yaml
│   └── hpa.yaml
│
└── docs/
    └── screenshots/
        ├── 01-gcloud-login.png
        ├── 02-gcp-project.png
        ├── 03-artifact-registry.png
        ├── 04-docker-images.png
        ├── 05-gke-cluster.png
        ├── 06-kubectl-nodes.png
        ├── 07-pods.png
        ├── 08-services.png
        ├── 09-mongodb.png
        ├── 10-pvc.png
        ├── 11-hpa.png
        ├── 12-frontend.png
        └── 13-github.png
```

---

# 39. GitHub Setup

Create a new GitHub repository:

```text
sample-mern-gcp-kubernetes
```

Then:

```bash
git init
```

Set the main branch:

```bash
git branch -M main
```

Add files:

```bash
git add .
```

Check:

```bash
git status
```

Commit:

```bash
git commit -m "Deploy MERN application on GKE"
```

Add GitHub remote:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/sample-mern-gcp-kubernetes.git
```

Push:

```bash
git push -u origin main
```

---

# 40. Submission Link

Create:

```text
SUBMISSION-LINK.txt
```

Content:

```text
Practice Assignment - GCP

GitHub Repository:

https://github.com/YOUR_GITHUB_USERNAME/sample-mern-gcp-kubernetes
```

Then:

```bash
git add SUBMISSION-LINK.txt
```

```bash
git commit -m "Add assignment submission link"
```

```bash
git push
```

Submit the repository link through VLearn.

---

# 41. Final Checklist

* [ ] Google Cloud CLI installed
* [ ] Google account authenticated
* [ ] Correct GCP project selected
* [ ] Required GCP APIs enabled
* [ ] Artifact Registry created
* [ ] Docker authenticated to Artifact Registry
* [ ] helloService Docker image created
* [ ] profileService Docker image created
* [ ] Frontend Docker image created
* [ ] Images pushed to Artifact Registry
* [ ] GKE cluster created
* [ ] kubectl connected to GKE
* [ ] Kubernetes namespace created
* [ ] MongoDB deployed
* [ ] MongoDB persistent storage created
* [ ] helloService deployed
* [ ] profileService deployed
* [ ] Frontend deployed
* [ ] Kubernetes Services created
* [ ] Frontend external IP obtained
* [ ] Application tested in browser
* [ ] Backend health endpoints tested
* [ ] HPA configured
* [ ] Scaling tested
* [ ] Screenshots captured
* [ ] README completed
* [ ] Kubernetes YAML committed
* [ ] GitHub repository pushed
* [ ] Submission link created
* [ ] GitHub URL submitted to VLearn

---

# 42. Useful Official Documentation

Google Cloud CLI:

https://cloud.google.com/sdk/docs/install

Google Cloud Authentication:

https://cloud.google.com/sdk/docs/authenticate

Artifact Registry:

https://cloud.google.com/artifact-registry/docs

Docker authentication for Artifact Registry:

https://cloud.google.com/artifact-registry/docs/docker/authentication

Google Kubernetes Engine:

https://cloud.google.com/kubernetes-engine/docs

Kubernetes documentation:

https://kubernetes.io/docs/

---

## Assignment Result

The completed project demonstrates deployment of a MERN microservices application on Google Cloud using Docker, Artifact Registry, Kubernetes and GKE.

The final deployment contains:

```text
React Frontend
      ↓
Nginx
      ↓
Kubernetes Services
      ↓
helloService + profileService
      ↓
MongoDB
      ↓
Persistent Storage
```

The application is externally accessible through the GKE LoadBalancer and can be scaled using Kubernetes Horizontal Pod Autoscaling.
