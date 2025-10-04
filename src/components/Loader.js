import Lottie from "lottie-react";
import truckLoader from "../assets/loader.json"; // your JSON file

const Loader = ({ message = "Processing... Please wait" }) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.1)"
        }}>
            <Lottie
                animationData={truckLoader}
                loop={true}
                style={{ width: 200, height: 200 }}
            />
            <p style={{ 
                marginTop: "1rem", 
                fontWeight: "bold", 
                color: "#0077b6",
                textAlign: "center",
                fontSize: "1.1rem"
            }}>
                {message}
            </p>
        </div>
    );
};

export default Loader;
