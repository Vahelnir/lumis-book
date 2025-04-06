
rootProject.name = "lumisbook"

include(":domain")
project(":domain").projectDir = file("backend/domain")

include(":infrastructure")
project(":infrastructure").projectDir = file("backend/infrastructure")
