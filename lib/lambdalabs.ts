async function api(
  api: string,
  method: 'POST' | 'GET' = 'GET',
  data?: { [key: string]: any }
) {
  const apiUrl = `https://cloud.lambdalabs.com/api/v1${api}`
  const requestOptions: RequestInit = {
    method: method,
    headers: {
      Authorization: `Basic ${process.env.LAMBDA_LABS_KEY}`,
      'Content-Type': 'application/json',
    },
  }

  if (data) {
    requestOptions.body = JSON.stringify(data)
  }

  const response = await fetch(apiUrl, requestOptions)
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }
  return await response.json()
}

export async function listInstances() {
  const result: ListInstancesResult = await api('/instances')
  return result
}

export async function terminateInstance(instanceId: string) {
  const result = await api('/instance-operations/terminate', 'POST', {
    instance_ids: [instanceId],
  })
  return result
}
