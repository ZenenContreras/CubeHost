const axios = require('axios');
const config = require('../config');

const client = axios.create({
  baseURL: config.containerManager.url,
  timeout: 300_000, // builds can take time, increased to 5 minutes
});

async function deployProject({ projectId, repoUrl, containerType, port, subdomain }) {
  const { data } = await client.post('/containers/deploy', {
    projectId,
    repoUrl,
    containerType,
    port,
    subdomain,
  });
  return data; // { containerId, status }
}

async function stopContainer(containerId) {
  const { data } = await client.post(`/containers/${containerId}/stop`);
  return data;
}

async function startContainer(containerId) {
  const { data } = await client.post(`/containers/${containerId}/start`);
  return data;
}

async function removeContainer(containerId) {
  const { data } = await client.delete(`/containers/${containerId}`);
  return data;
}

async function getContainerStatus(containerId) {
  const { data } = await client.get(`/containers/${containerId}/status`);
  return data; // { status, lastActivity }
}

module.exports = {
  deployProject,
  stopContainer,
  startContainer,
  removeContainer,
  getContainerStatus,
};
