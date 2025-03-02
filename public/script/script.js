document.addEventListener('DOMContentLoaded', function() {
    const chatBotBtn = document.getElementById('chatBotBtn');
    const chatBotModal = document.getElementById('chatBotModal');
    const closeChatBot = document.getElementById('closeChatBot');
    const chatInput = document.getElementById('chatInput');
    const sendMessage = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');

    // Toggle chat bot
    chatBotBtn.addEventListener('click', () => {
        chatBotModal.classList.toggle('active');
        chatBotBtn.classList.toggle('active');
    });

    closeChatBot.addEventListener('click', () => {
        chatBotModal.classList.remove('active');
        chatBotBtn.classList.remove('active');
    });

    // Send message function
    function sendChatMessage() {
        const message = chatInput.value.trim();
        if (message) {
            // Add user message
            addMessage(message, 'user');
            chatInput.value = '';

            // Simulate bot response (replace with actual API call)
            setTimeout(() => {
                const responses = [
                    "I'll help you with that!",
                    "Let me check that for you.",
                    "That's an interesting question.",
                    "I understand what you're looking for.",
                    "CONTACH EMAIL - help@killbttle.online"
                    
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addMessage(randomResponse, 'bot');
            }, 1000);
        }
    }

    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Send message on button click
    sendMessage.addEventListener('click', sendChatMessage);

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
})





// Three.js Scene Setup
const setupThreeScene = () => {
    const container = document.getElementById('hero-canvas');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Create geometries
    const geometries = [];
    const materials = [];
    const meshes = [];

    // Updated shapes with more interesting options
    const shapes = [
        new THREE.TorusKnotGeometry(1.5, 0.5),
        new THREE.OctahedronGeometry(1.2),
        new THREE.DodecahedronGeometry(1.2),
        new THREE.IcosahedronGeometry(1.2)
    ];

    // Create floating objects with dynamic colors
    for (let i = 0; i < 6; i++) {
        const geometry = shapes[i % shapes.length];
        geometries.push(geometry);

        // More vibrant color palette
        const hue = (i * 60) % 360;
        materials.push(new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${hue}, 80%, 60%)`),
            transparent: true,
            opacity: 0.9,
            shininess: 100,
            specular: 0x666666
        }));

        meshes.push(new THREE.Mesh(geometries[i], materials[i]));
        meshes[i].position.set(
            Math.random() * 30 - 15,
            Math.random() * 30 - 15,
            Math.random() * 30 - 15
        );
        scene.add(meshes[i]);
    }

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff9000, 1, 100);
    pointLight.position.set(-5, -5, -5);
    scene.add(pointLight);

    camera.position.z = 25;

    // Mouse movement effect
    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - window.innerWidth / 2) / 100;
        mouseY = (event.clientY - window.innerHeight / 2) / 100;
    });

    // Animation parameters
    const time = {
        value: 0
    };

    // Animation loop with two different animations
    const animate = () => {
        requestAnimationFrame(animate);
        time.value += 0.01;

        // Smooth camera movement
        camera.position.x += (mouseX - camera.position.x) * 0.05;
        camera.position.y += (-mouseY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        // Animation 1: Rotating and floating objects
        meshes.forEach((mesh, i) => {
            mesh.rotation.x += 0.003 * (i % 2 ? 1 : -1);
            mesh.rotation.y += 0.003 * (i % 3 ? 1 : -1);
            mesh.position.y += Math.sin(time.value + i) * 0.02;
        });

        // Animation 2: Pulsating effect
        meshes.forEach((mesh, i) => {
            const scale = 1 + Math.sin(time.value * 2 + i) * 0.1;
            mesh.scale.set(scale, scale, scale);
            mesh.material.opacity = 0.7 + Math.sin(time.value + i) * 0.2;
        });

        renderer.render(scene, camera);
    };

    // Responsive canvas
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });

    animate();
};

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            gsap.to(window, {
                duration: 1,
                scrollTo: {
                    y: target,
                    offsetY: 70
                },
                ease: "power2.inOut"
            });
        }
    });
});

// Counter Animation
const animateCounter = (element, target) => {
    let current = 0;
    const increment = target / 100;
    const update = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.ceil(current);
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
        }
    };
    update();
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupThreeScene();

    // Initialize counters when they come into view
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    animateCounter(counter, parseInt(counter.dataset.target));
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(counter);
    });
});