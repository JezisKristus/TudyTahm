using System.ComponentModel.DataAnnotations;

namespace TT_API.DTOs {
    public class CreateMapDTO {
        public int IDUser { get; set; }
        public bool IsCustom { get; set; }
        public string MapName { get; set; }
        public string MapPath { get; set; }

    }
}
