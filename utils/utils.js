// for generating password
let chars =
	"0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let passwordLength = process.env.PASSWORD_LENGTH || 12;
let password = "";

export const generatePassword = async () => {
	for (let i = 0; i <= passwordLength; i++) {
		var randomNumber = Math.floor(Math.random() * chars.length);
		password += chars.substring(randomNumber, randomNumber + 1);
	}
	return password;
};

export const generateRandomUsername = async (name) => {
	let username = name + Math.floor(Math.random() * 1000 + 1);
	return username;
};

export const formatDateTime = async(isoDateString)=>{
  const date = new Date(isoDateString);

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  };

  const formattedDate = date.toLocaleString("en-US", options);
  return formattedDate;
}