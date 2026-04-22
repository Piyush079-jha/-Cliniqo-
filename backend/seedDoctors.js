import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });


const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  nic: { type: String },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  doctorDepartment: { type: String },
  docAvatar: { public_id: String, url: String },
  avatar: { public_id: String, url: String },
});

const User = mongoose.model("User", userSchema);

const doctors = [
  // Cardiology
  {
    firstName: "Piyush",
    lastName: "Jha",
    email: "jhaji1134@gmail.com",
    doctorDepartment: "Cardiology",
  },
  {
    firstName: "Arjun",
    lastName: "Sharma",
    email: "arjun.sharma@cliniqo.com",
    doctorDepartment: "Cardiology",
  },
  {
    firstName: "Neha",
    lastName: "Kapoor",
    email: "neha.kapoor@cliniqo.com",
    doctorDepartment: "Cardiology",
  },
  {
    firstName: "Rajesh",
    lastName: "Menon",
    email: "rajesh.menon@cliniqo.com",
    doctorDepartment: "Cardiology",
  },
  {
    firstName: "Sunita",
    lastName: "Rao",
    email: "sunita.rao@cliniqo.com",
    doctorDepartment: "Cardiology",
  },
  {
    firstName: "Vikram",
    lastName: "Bose",
    email: "vikram.bose@cliniqo.com",
    doctorDepartment: "Cardiology",
  },

  // Neurology
  {
    firstName: "Priya",
    lastName: "Mehta",
    email: "priya.mehta@cliniqo.com",
    doctorDepartment: "Neurology",
  },
  {
    firstName: "Anil",
    lastName: "Verma",
    email: "anil.verma@cliniqo.com",
    doctorDepartment: "Neurology",
  },
  {
    firstName: "Deepa",
    lastName: "Nair",
    email: "deepa.nair@cliniqo.com",
    doctorDepartment: "Neurology",
  },
  {
    firstName: "Sanjay",
    lastName: "Iyer",
    email: "sanjay.iyer@cliniqo.com",
    doctorDepartment: "Neurology",
  },
  {
    firstName: "Meera",
    lastName: "Pillai",
    email: "meera.pillai@cliniqo.com",
    doctorDepartment: "Neurology",
  },
  {
    firstName: "Karthik",
    lastName: "Das",
    email: "karthik.das@cliniqo.com",
    doctorDepartment: "Neurology",
  },

  // Oncology
  {
    firstName: "Rohan",
    lastName: "Verma",
    email: "rohan.verma@cliniqo.com",
    doctorDepartment: "Oncology",
  },
  {
    firstName: "Pooja",
    lastName: "Sharma",
    email: "pooja.sharma@cliniqo.com",
    doctorDepartment: "Oncology",
  },
  {
    firstName: "Nikhil",
    lastName: "Reddy",
    email: "nikhil.reddy@cliniqo.com",
    doctorDepartment: "Oncology",
  },
  {
    firstName: "Ananya",
    lastName: "Singh",
    email: "ananya.singh@cliniqo.com",
    doctorDepartment: "Oncology",
  },
  {
    firstName: "Suresh",
    lastName: "Joshi",
    email: "suresh.joshi@cliniqo.com",
    doctorDepartment: "Oncology",
  },
  {
    firstName: "Divya",
    lastName: "Kulkarni",
    email: "divya.kulkarni@cliniqo.com",
    doctorDepartment: "Oncology",
  },

  //  Radiology
  {
    firstName: "Sneha",
    lastName: "Patel",
    email: "sneha.patel@cliniqo.com",
    doctorDepartment: "Radiology",
  },
  {
    firstName: "Manish",
    lastName: "Tiwari",
    email: "manish.tiwari@cliniqo.com",
    doctorDepartment: "Radiology",
  },
  {
    firstName: "Rekha",
    lastName: "Chandra",
    email: "rekha.chandra@cliniqo.com",
    doctorDepartment: "Radiology",
  },
  {
    firstName: "Alok",
    lastName: "Mishra",
    email: "alok.mishra@cliniqo.com",
    doctorDepartment: "Radiology",
  },
  {
    firstName: "Tanvi",
    lastName: "Shah",
    email: "tanvi.shah@cliniqo.com",
    doctorDepartment: "Radiology",
  },
  {
    firstName: "Prakash",
    lastName: "Nanda",
    email: "prakash.nanda@cliniqo.com",
    doctorDepartment: "Radiology",
  },

  //  Pediatrics
  {
    firstName: "Amit",
    lastName: "Kumar",
    email: "amit.kumar@cliniqo.com",
    doctorDepartment: "Pediatrics",
  },
  {
    firstName: "Shruti",
    lastName: "Ghosh",
    email: "shruti.ghosh@cliniqo.com",
    doctorDepartment: "Pediatrics",
  },
  {
    firstName: "Ravi",
    lastName: "Pandey",
    email: "ravi.pandey@cliniqo.com",
    doctorDepartment: "Pediatrics",
  },
  {
    firstName: "Nandini",
    lastName: "Roy",
    email: "nandini.roy@cliniqo.com",
    doctorDepartment: "Pediatrics",
  },
  {
    firstName: "Gaurav",
    lastName: "Saxena",
    email: "gaurav.saxena@cliniqo.com",
    doctorDepartment: "Pediatrics",
  },
  {
    firstName: "Ishita",
    lastName: "Bansal",
    email: "ishita.bansal@cliniqo.com",
    doctorDepartment: "Pediatrics",
  },

  // Orthopedics
  {
    firstName: "Kavya",
    lastName: "Singh",
    email: "kavya.singh@cliniqo.com",
    doctorDepartment: "Orthopedics",
  },
  {
    firstName: "Harish",
    lastName: "Malhotra",
    email: "harish.malhotra@cliniqo.com",
    doctorDepartment: "Orthopedics",
  },
  {
    firstName: "Simran",
    lastName: "Kaur",
    email: "simran.kaur@cliniqo.com",
    doctorDepartment: "Orthopedics",
  },
  {
    firstName: "Deepak",
    lastName: "Aggarwal",
    email: "deepak.aggarwal@cliniqo.com",
    doctorDepartment: "Orthopedics",
  },
  {
    firstName: "Preeti",
    lastName: "Dubey",
    email: "preeti.dubey@cliniqo.com",
    doctorDepartment: "Orthopedics",
  },
  {
    firstName: "Varun",
    lastName: "Khanna",
    email: "varun.khanna@cliniqo.com",
    doctorDepartment: "Orthopedics",
  },

  //  Physical Therapy
  {
    firstName: "Rahul",
    lastName: "Gupta",
    email: "rahul.gupta@cliniqo.com",
    doctorDepartment: "Physical Therapy",
  },
  {
    firstName: "Smita",
    lastName: "Desai",
    email: "smita.desai@cliniqo.com",
    doctorDepartment: "Physical Therapy",
  },
  {
    firstName: "Tarun",
    lastName: "Mathur",
    email: "tarun.mathur@cliniqo.com",
    doctorDepartment: "Physical Therapy",
  },
  {
    firstName: "Pallavi",
    lastName: "Jain",
    email: "pallavi.jain@cliniqo.com",
    doctorDepartment: "Physical Therapy",
  },
  {
    firstName: "Girish",
    lastName: "Patil",
    email: "girish.patil@cliniqo.com",
    doctorDepartment: "Physical Therapy",
  },
  {
    firstName: "Ritu",
    lastName: "Sinha",
    email: "ritu.sinha@cliniqo.com",
    doctorDepartment: "Physical Therapy",
  },

  //  Dermatology
  {
    firstName: "Anjali",
    lastName: "Nair",
    email: "anjali.nair@cliniqo.com",
    doctorDepartment: "Dermatology",
  },
  {
    firstName: "Mohit",
    lastName: "Arora",
    email: "mohit.arora@cliniqo.com",
    doctorDepartment: "Dermatology",
  },
  {
    firstName: "Shweta",
    lastName: "Trivedi",
    email: "shweta.trivedi@cliniqo.com",
    doctorDepartment: "Dermatology",
  },
  {
    firstName: "Kunal",
    lastName: "Bajaj",
    email: "kunal.bajaj@cliniqo.com",
    doctorDepartment: "Dermatology",
  },
  {
    firstName: "Namrata",
    lastName: "Hegde",
    email: "namrata.hegde@cliniqo.com",
    doctorDepartment: "Dermatology",
  },
  {
    firstName: "Vishal",
    lastName: "Oberoi",
    email: "vishal.oberoi@cliniqo.com",
    doctorDepartment: "Dermatology",
  },

  //  ENT
  {
    firstName: "Vikram",
    lastName: "Rao",
    email: "vikram.rao@cliniqo.com",
    doctorDepartment: "ENT",
  },
  {
    firstName: "Archana",
    lastName: "Bhatt",
    email: "archana.bhatt@cliniqo.com",
    doctorDepartment: "ENT",
  },
  {
    firstName: "Sameer",
    lastName: "Dixit",
    email: "sameer.dixit@cliniqo.com",
    doctorDepartment: "ENT",
  },
  {
    firstName: "Lata",
    lastName: "Shetty",
    email: "lata.shetty@cliniqo.com",
    doctorDepartment: "ENT",
  },
  {
    firstName: "Praveen",
    lastName: "Nambiar",
    email: "praveen.nambiar@cliniqo.com",
    doctorDepartment: "ENT",
  },
  {
    firstName: "Geeta",
    lastName: "Menon",
    email: "geeta.menon@cliniqo.com",
    doctorDepartment: "ENT",
  },
];

const commonFields = {
  phone: "9876543210",
  nic: "1234567890123",
  dob: new Date("1985-06-15"),
  gender: "Male",
  password: "Doctor@1234",
  role: "Doctor",
  docAvatar: {
    public_id: "default_avatar",
    url: "https://res.cloudinary.com/demo/image/upload/v1/doctor_placeholder.png",
  },
};

const seedDoctors = async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: "HSM" });
    console.log("✅ Connected to MongoDB");

    

    let added = 0;
    let skipped = 0;

    for (const doc of doctors) {
      const exists = await User.findOne({ email: doc.email });
      if (exists) {
        console.log(
          `⏭️  Skipped (already exists): ${doc.firstName} ${doc.lastName} — ${doc.doctorDepartment}`,
        );
        skipped++;
        continue;
      }

      const hashed = await bcrypt.hash(commonFields.password, 10);
await User.create({
  ...commonFields,
  ...doc,
  password: hashed,
});
      console.log(
        `✅ Added: Dr. ${doc.firstName} ${doc.lastName} — ${doc.doctorDepartment}`,
      );
      added++;
    }

    console.log(`\n🎉 Done! ${added} doctors added, ${skipped} skipped.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

seedDoctors();
