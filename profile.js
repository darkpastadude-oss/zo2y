// ===== profile.js =====

const supabaseUrl = "https://gfkhjbztayjyojsgdpgk.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", async () => {
  const profileContainer = document.getElementById("profile-container");
  const loading = document.createElement("div");
  loading.textContent = "Loading profile...";
  loading.className = "text-gray-400 text-sm mt-4";
  profileContainer.appendChild(loading);

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    window.location.href = "login.html";
    return;
  }

  // pull user profile
  let { data: profileData, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error loading profile:", profileError);
  }

  if (!profileData) {
    // create default profile
    const defaultProfile = {
      id: user.id,
      username:
        user.user_metadata?.username ||
        user.email.split("@")[0],
      email: user.email,
      bio: "Hey there 👋 I’m new to Zo2y!",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_profiles")
      .insert([defaultProfile])
      .select()
      .single();

    if (error) console.error("Error creating default profile:", error);
    profileData = data || defaultProfile;
  }

  profileContainer.innerHTML = `
    <div class="bg-[#0a0f1c] min-h-screen flex flex-col items-center text-white p-6 font-sans">
      <div class="max-w-lg w-full bg-[#11182a] rounded-2xl shadow-lg p-6 text-center">
        <div class="flex justify-center mb-6">
          <div class="h-24 w-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-4xl font-bold">
            ${profileData.username.charAt(0).toUpperCase()}
          </div>
        </div>
        <h2 class="text-2xl font-bold text-[#ffb84d]">${profileData.username}</h2>
        <p class="text-gray-400 text-sm mb-2">${profileData.email}</p>
        <p class="text-gray-300 mt-3">${profileData.bio}</p>

        <div class="mt-6 flex justify-center gap-3">
          <button id="edit-btn" class="bg-[#ffb84d] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#ffcb6b] transition">Edit Profile</button>
          <button id="logout-btn" class="bg-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition">Logout</button>
        </div>
      </div>

      <div class="mt-10 w-full max-w-lg text-center">
        <h3 class="text-[#ffb84d] text-lg font-semibold mb-2">Your Lists & Favorites</h3>
        <p class="text-gray-400 text-sm">Feature coming soon 😎</p>
      </div>
    </div>
  `;

  // logout
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });

  // edit bio
  document.getElementById("edit-btn").addEventListener("click", async () => {
    const newBio = prompt("Update your bio:", profileData.bio);
    if (!newBio) return;

    const { error } = await supabase
      .from("user_profiles")
      .update({ bio: newBio })
      .eq("id", user.id);

    if (!error) {
      alert("Profile updated!");
      location.reload();
    } else {
      console.error("Error updating profile:", error);
      alert("Something went wrong.");
    }
  });
});
