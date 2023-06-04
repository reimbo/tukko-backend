const axios = require('axios').default;

export async function grab(url: String): Promise<String> {
  try {
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}
