const apiUrl = "https://api.musixmatch.com/ws/1.1/";

// Define API key (if required)
const apiKey = "eaff3968904283162bfa3a9518519a9e";

// Define headers (if required)
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${apiKey}`,
};

// Define a function to make API requests
async function makeApiRequest(endpoint, method, body) {
  try {
    const response = await fetch(`${apiUrl}/${endpoint}`, {
      method: method,
      headers: headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Example usage:
async function fetchUserData(userId) {
  try {
    const userData = await makeApiRequest(`users/${userId}`, "GET");
    console.log("User data:", userData);
    return userData;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw error;
  }
}
async function getSong(params) {
  const endpoint = "track.search";
  const method = "GET";
  const queryParams = new URLSearchParams(params);
  const url = `${apiUrl}/${endpoint}?${queryParams}`;

  try {
    const response = await fetch(url, {
      method: method,
      headers: headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

getSong({
  q_track: "hello",
  q_artist: "adele",
  f_has_lyrics: true,
  page_size: 1,
}).then((data) => {
  console.log(data);
});
