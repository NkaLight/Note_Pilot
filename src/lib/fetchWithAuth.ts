
let refreshPromise:Promise<boolean>|null = null;

async function refreshToken():Promise<boolean>{
  if(!refreshPromise){
    refreshPromise = fetch("/api/refresh_token", {
      method:"POST",
      credentials:"include"
    })
    .then(res => res.ok)
    .finally(()=>{
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let res = await fetch(url, { ...options, credentials: "include" });

  if (res.status === 401) {
    const refreshRes = await refreshToken();

    if (refreshRes) {
      res = await fetch(url, { ...options, credentials: "include" });
    }
  }

  return res;
}
